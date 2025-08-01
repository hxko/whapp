"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  collection,
  getDoc,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  updateDoc,
  Timestamp,
  onSnapshot,
  orderBy,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebase"; // adjust path as needed
import { useAuth } from "@/components/AuthProvider";
import CryptoJS from "crypto-js";

import { Messagetype } from "@/types"; // adjust path as needed

// Your encryption key (ensure this env var is set)
const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTOKEY as string;

// Encryption and decryption helpers:

export const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

export const decryptMessage = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
// === Context Types ===

interface MessagesContextType {
  messagesByChat: Record<string, Messagetype[]>;

  // Realtime subscription controls
  subscribeToChatMessages: (chatId: string) => void;
  unsubscribeFromChatMessages: (chatId: string) => void;

  // Accessors
  getMessages: (chatId: string) => Messagetype[] | undefined;
  getLastMessage: (chatId: string) => Messagetype | undefined;
  getUnreadCount: (chatId: string, userEmail: string) => number;
  lastReadTimestamps: Record<string, Record<string, Timestamp>>;
  // Message status tracking
  markMessageAsRead: (
    chatId: string,
    userEmail: string,
    messageId: string
  ) => Promise<void>;
  markMessageAsDelivered: (
    chatId: string,
    userEmail: string,
    messageId: string
  ) => Promise<void>;

  // Message sending, replying, reacting
  sendMessage: (
    chatId: string,
    sender: string,
    text: string
  ) => Promise<Messagetype | void>;
  replyToMessage: (
    chatId: string,
    messageId: string,
    replyMessage: string,
    sender: string
  ) => Promise<Messagetype | void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  toggleReaction: (
    chatId: string,
    messageId: string,
    emoji: string,
    userEmail: string
  ) => Promise<void>;
}

// === Context Setup ===

const MessagesCtx = createContext<MessagesContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessagesCtx);
  if (!context) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
};

// === Provider Component ===

interface MessagesProviderProps {
  children: ReactNode;
}
type LastReadTimestamps = Record<string, Record<string, Timestamp>>;
export const MessagesProvider = ({ children }: MessagesProviderProps) => {
  // === LOCAL STATES ===
  const { user } = useAuth();
  const [lastReadTimestamps, setLastReadTimestamps] =
    useState<LastReadTimestamps>({});

  // Tracks active Firestore listeners for lastReadTimestamps
  const lastReadListeners = React.useRef<Record<string, () => void>>({});
  // 🔐 Hilfsfunktion zum Escapen von E-Mail-Adressen für Firestore dot-notation
  function escapeEmail(email: string): string {
    return email.replace(/\./g, "__dot__");
  }

  // ✅ Funktion zum Aktualisieren des letzten Lesezeitpunkts
  const updateLastReadTimestampInFirestore = useCallback(
    async (chatId: string, userEmail: string, timestamp: Timestamp) => {
      const escapedEmail = escapeEmail(userEmail);

      // 1. Optimistische lokale Aktualisierung
      setLastReadTimestamps((prev) => ({
        ...prev,
        [chatId]: {
          ...(prev[chatId] || {}),
          [escapedEmail]: timestamp,
        },
      }));

      // 2. Persistieren in Firestore
      try {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
          [`lastReadBy.${escapedEmail}`]: timestamp,
        });
      } catch (error) {
        console.error(
          "[Firestore Write Error] Failed to update last read timestamp in Firestore:",
          error
        );

        // Optional: Rückgängig machen bei Fehler
        setLastReadTimestamps((prev) => {
          const newState = { ...prev };
          if (newState[chatId]) {
            delete newState[chatId][escapedEmail];
          }
          return newState;
        });
      }
    },
    [] // Keine externen Abhängigkeiten
  );

  // Stores messages per chatId
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, Messagetype[]>
  >({});

  // Tracks active Firestore listeners to unsubscribe later
  const listeners = React.useRef<Record<string, () => void>>({});

  /**
   * Subscribes to real-time updates for messages in a chat.
   * Decrypts the message text before storing in state.
   */
  const subscribeToChatMessages = useCallback(async (chatId: string) => {
    if (listeners.current[chatId]) return;

    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMessages: Messagetype[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          text: decryptMessage(data.text),
          timestamp: data.timestamp,
          replyTo: data.replyTo,
          reactions: data.reactions || {},
          readBy: data.readBy || [],
          deliveredTo: data.deliveredTo || [],
          updatedAt: data.updatedAt || data.timestamp, // fallback to timestamp
        } as Messagetype;
      });

      setMessagesByChat((prev) => {
        const prevMessages = prev[chatId] || [];

        const same =
          prevMessages.length === newMessages.length &&
          prevMessages.every((m, i) => {
            const n = newMessages[i];
            return (
              m.id === n.id &&
              m.text === n.text &&
              JSON.stringify(m.reactions) === JSON.stringify(n.reactions) &&
              JSON.stringify(m.readBy) === JSON.stringify(n.readBy) &&
              JSON.stringify(m.deliveredTo) === JSON.stringify(n.deliveredTo) &&
              m.updatedAt?.toMillis?.() === n.updatedAt?.toMillis?.()
            );
          });

        if (same) return prev;

        return {
          ...prev,
          [chatId]: newMessages,
        };
      });
    });

    listeners.current[chatId] = unsubscribe;
  }, []);

  /**
   * Unsubscribes from message updates for a chat and cleans up local state.
   */
  const unsubscribeFromChatMessages = useCallback((chatId: string) => {
    if (listeners.current[chatId]) {
      listeners.current[chatId](); // Call the unsubscribe function
      delete listeners.current[chatId];

      setMessagesByChat((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
    }
  }, []);

  /**
   * Returns the message array for a specific chat.
   */
  const getMessages = useCallback(
    (chatId: string) => messagesByChat[chatId],
    [messagesByChat]
  );

  /**
   * Returns the latest message in a chat.
   */
  const getLastMessage = useCallback(
    (chatId: string) => {
      const messages = messagesByChat[chatId];
      if (!messages || messages.length === 0) return undefined;
      return messages[messages.length - 1]; // messages are ordered by timestamp
    },
    [messagesByChat]
  );

  // Modified markMessageAsRead to use the new updateLastReadTimestampInFirestore function
  const markMessageAsRead = useCallback(
    async (chatId: string, userEmail: string, messageId: string) => {
      const messages = messagesByChat[chatId];
      if (!messages) return;

      const message = messages.find((msg) => msg.id === messageId);
      if (!message) return;
      if (message.sender === userEmail) return; // Don't mark own messages

      // Optimistic update for readBy array (keep this)
      setMessagesByChat((prev) => {
        const chatMessages = prev[chatId] || [];
        const updated = chatMessages.map((msg) => {
          if (msg.id === messageId) {
            // Only add userEmail to readBy if not already there,
            // as this array typically means "has this message been read at least once"
            if (!(msg.readBy || []).includes(userEmail)) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), userEmail],
              };
            }
          }
          return msg;
        });
        return { ...prev, [chatId]: updated };
      });

      // CRITICAL: Update lastReadTimestamp in Firestore
      // This happens for the specific message being marked as read.
      // If this is the 'latest' message in the chat, it will correctly update
      // the overall 'last viewed' timestamp for the chat.
      const timestampToSet = message.updatedAt || message.timestamp;
      if (timestampToSet) {
        await updateLastReadTimestampInFirestore(
          chatId,
          userEmail,
          timestampToSet
        );
      }

      // Firestore update for the specific message's readBy array (keep this)
      const ref = doc(db, `chats/${chatId}/messages`, messageId);
      try {
        await updateDoc(ref, {
          readBy: arrayUnion(userEmail),
        });
      } catch (error) {
        console.error("Failed to mark message as read:", error);
        // Consider reverting optimistic update here if needed
      }
    },
    [messagesByChat, updateLastReadTimestampInFirestore] // Update dependency
  );

  const markMessageAsDelivered = useCallback(
    async (chatId: string, userEmail: string, messageId: string) => {
      const messages = messagesByChat[chatId];
      if (!messages) return;

      const message = messages.find((msg) => msg.id === messageId);
      if (!message) return;
      if (message.sender === userEmail) return; // Don't mark own messages
      if ((message.deliveredTo || []).includes(userEmail)) return; // Already delivered

      // Optimistic update
      setMessagesByChat((prev) => {
        const chatMessages = prev[chatId] || [];
        const updated = chatMessages.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              deliveredTo: [...(msg.deliveredTo || []), userEmail],
            };
          }
          return msg;
        });
        return { ...prev, [chatId]: updated };
      });

      // Firestore update with arrayUnion
      const ref = doc(db, `chats/${chatId}/messages`, messageId);
      try {
        await updateDoc(ref, {
          deliveredTo: arrayUnion(userEmail),
        });
      } catch (error) {
        console.error("Failed to mark message as delivered:", error);
      }
    },
    [messagesByChat]
  );

  /**
   * Calculates how many messages in a chat are unread by the user.
   * Includes updates from replies and reactions.
   */
  const getUnreadCount = useCallback(
    (chatId: string, userEmail: string) => {
      const messages = messagesByChat[chatId] || [];
      const lastRead = lastReadTimestamps[chatId]?.[escapeEmail(userEmail)];

      return messages.filter((msg) => {
        if (msg.sender === userEmail) return false;

        const wasRead = msg.readBy?.includes(userEmail);
        const hasReactionOrUpdateAfterLastRead =
          msg.updatedAt &&
          lastRead &&
          msg.updatedAt.toMillis() > lastRead.toMillis();

        return !wasRead || hasReactionOrUpdateAfterLastRead;
      }).length;
    },
    [messagesByChat, lastReadTimestamps]
  );

  // --- sendMessage ohne optimistisches Update ---
  const sendMessage = useCallback(
    async (
      chatId: string,
      sender: string,
      text: string
    ): Promise<Messagetype | void> => {
      try {
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const encryptedText = encryptMessage(text);

        const docRef = await addDoc(messagesRef, {
          sender,
          text: encryptedText,
          timestamp: serverTimestamp(),
          updatedAt: serverTimestamp(), // Ensure createdAt is also set for new messages
        });

        return {
          id: docRef.id,
          sender,
          text,
          timestamp: Timestamp.now(),
          updatedAt: Timestamp.now(), // Use client-side timestamp for immediate UI consistency
          replyTo: undefined,
          reactions: {},
        };
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    },
    []
  );

  // --- replyToMessage ohne optimistisches Update ---
  const replyToMessage = useCallback(
    async (
      chatId: string,
      messageId: string,
      replyMessage: string,
      sender: string
    ): Promise<Messagetype | void> => {
      try {
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const encryptedText = encryptMessage(replyMessage);

        const docRef = await addDoc(messagesRef, {
          sender,
          text: encryptedText,
          timestamp: serverTimestamp(),
          replyTo: messageId,
          updatedAt: serverTimestamp(), // Ensure updatedAt is also set for replies
        });

        return {
          id: docRef.id,
          sender,
          text: replyMessage,
          timestamp: Timestamp.now(),
          updatedAt: Timestamp.now(), // Use client-side timestamp for immediate UI consistency
          replyTo: messageId,
          reactions: {},
        };
      } catch (error) {
        console.error("Error replying to message: ", error);
      }
    },
    []
  );

  // --- deleteMessage ---
  const deleteMessage = useCallback(
    async (chatId: string, messageId: string) => {
      try {
        // Optimistic local update: remove message and its replies locally first
        setMessagesByChat((prev) => {
          const prevMessages = prev[chatId] || [];
          const filteredMessages = prevMessages.filter(
            (msg) => msg.id !== messageId && msg.replyTo !== messageId
          );
          return { ...prev, [chatId]: filteredMessages };
        });

        const messageRef = doc(db, `chats/${chatId}/messages`, messageId);

        // Delete replies referencing this message
        const repliesRef = collection(db, `chats/${chatId}/messages`);
        const q = query(repliesRef, where("replyTo", "==", messageId));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );

        await Promise.all(deletePromises);
        await deleteDoc(messageRef);
      } catch (error) {
        console.error("Error deleting message: ", error);
      }
    },
    []
  );

  // --- toggleReaction ---
  const toggleReaction = useCallback(
    async (
      chatId: string,
      messageId: string,
      emoji: string,
      userEmail: string
    ) => {
      try {
        const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) return;

        const data = messageSnap.data();
        const reactions = data.reactions || {};
        const currentUsers = reactions[emoji] || [];

        const userHasReacted = currentUsers.includes(userEmail);

        const updatedReactions = {
          ...reactions,
          [emoji]: userHasReacted
            ? currentUsers.filter((email: string) => email !== userEmail)
            : [...currentUsers, userEmail],
        };

        // Clean up empty reactions
        Object.keys(updatedReactions).forEach((key) => {
          if (updatedReactions[key].length === 0) {
            delete updatedReactions[key];
          }
        });

        await updateDoc(messageRef, {
          reactions: updatedReactions,
          updatedAt: serverTimestamp(),
        });

        // Optimistic local update for reactions
        setMessagesByChat((prev) => {
          const prevMessages = prev[chatId] || [];
          const updatedMessages = prevMessages.map((msg) => {
            if (msg.id !== messageId) return msg;

            const newReactions = msg.reactions ? { ...msg.reactions } : {};

            if (userHasReacted) {
              newReactions[emoji] = (newReactions[emoji] || []).filter(
                (email) => email !== userEmail
              );
              if (newReactions[emoji].length === 0) delete newReactions[emoji];
            } else {
              newReactions[emoji] = [...(newReactions[emoji] || []), userEmail];
            }

            return {
              ...msg,
              reactions: newReactions,
              updatedAt: Timestamp.fromDate(new Date()),
            };
          });
          return { ...prev, [chatId]: updatedMessages };
        });
      } catch (error) {
        console.error("Error toggling emoji reaction: ", error);
      }
    },
    []
  );

  /**
   * On unmount, remove all Firestore listeners to prevent memory leaks.
   */
  useEffect(() => {
    // Cleanup for message listeners
    return () => {
      Object.values(listeners.current).forEach((unsubscribe) => unsubscribe());
      listeners.current = {};
      // Cleanup for lastReadTimestamps listeners if any were added dynamically
      Object.values(lastReadListeners.current).forEach((unsubscribe) =>
        unsubscribe()
      );
      lastReadListeners.current = {};
    };
  }, []);

  // NEW useEffect for fetching and listening to lastReadTimestamps from Firestore
  useEffect(() => {
    if (!user?.email) {
      setLastReadTimestamps({}); // Clear state if user logs out or is not available
      // Clean up any existing listeners for lastReadTimestamps if user logs out
      Object.values(lastReadListeners.current).forEach((unsubscribe) =>
        unsubscribe()
      );
      lastReadListeners.current = {};
      return;
    }

    const currentUserEmail = user.email; // Capture user.email for the closure

    // This listener will fetch and keep updated the lastReadTimestamps for chats
    // the current user is a member of.

    const chatsQuery = query(
      collection(db, "chats"),
      where("users", "array-contains", currentUserEmail)
    );

    const unsubscribeLastRead = onSnapshot(
      chatsQuery,
      (querySnapshot) => {
        const fetchedTimestamps: LastReadTimestamps = {};
        querySnapshot.forEach((doc) => {
          const chatData = doc.data();
          const chatId = doc.id;
          if (chatData.lastReadBy && chatData.lastReadBy[currentUserEmail]) {
            fetchedTimestamps[chatId] = {
              [currentUserEmail]: chatData.lastReadBy[
                currentUserEmail
              ] as Timestamp,
            };
          }
        });

        // Merge fetched timestamps with existing ones, or replace if a comprehensive sync is desired.
        // Merging is safer if different parts of the app manage different chat data.
        setLastReadTimestamps((prev) => ({ ...prev, ...fetchedTimestamps }));
      },
      (error) => {
        console.error(
          "[Firestore Listener Error] Error listening to lastReadTimestamps:",
          error
        );
      }
    );

    // Store the unsubscribe function to clean it up when the user changes or component unmounts
    lastReadListeners.current[currentUserEmail] = unsubscribeLastRead;

    return () => {
      // Cleanup this specific listener when user changes or component unmounts
      if (lastReadListeners.current[currentUserEmail]) {
        lastReadListeners.current[currentUserEmail]();
        delete lastReadListeners.current[currentUserEmail];
      }
    };
  }, [user?.email]); // Re-run this effect when the user email changes

  return (
    <MessagesCtx.Provider
      value={{
        messagesByChat,
        subscribeToChatMessages,
        unsubscribeFromChatMessages,
        getMessages,
        getLastMessage,
        lastReadTimestamps,
        getUnreadCount,
        markMessageAsRead,
        markMessageAsDelivered,
        sendMessage,
        deleteMessage,
        replyToMessage,
        toggleReaction,
      }}
    >
      {children}
    </MessagesCtx.Provider>
  );
};
