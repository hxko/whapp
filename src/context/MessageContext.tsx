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

export const MessagesProvider = ({ children }: MessagesProviderProps) => {
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
        } as Messagetype;
      });
      console.log("🔥 Snapshot received", newMessages);
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
              JSON.stringify(m.deliveredTo) === JSON.stringify(n.deliveredTo)
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

  const markMessageAsRead = useCallback(
    async (chatId: string, userEmail: string, messageId: string) => {
      const messages = messagesByChat[chatId];
      if (!messages) return;

      const message = messages.find((msg) => msg.id === messageId);
      if (!message) return;
      if (message.sender === userEmail) return; // Don't mark own messages
      if ((message.readBy || []).includes(userEmail)) return; // Already read

      // Optimistic update
      setMessagesByChat((prev) => {
        const chatMessages = prev[chatId] || [];
        const updated = chatMessages.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              readBy: [...(msg.readBy || []), userEmail],
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
          readBy: arrayUnion(userEmail),
        });
      } catch (error) {
        console.error("Failed to mark message as read:", error);
      }
    },
    [messagesByChat]
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
   */
  const getUnreadCount = useCallback(
    (chatId: string, userEmail: string) => {
      const messages = messagesByChat[chatId] || [];
      const count = messages.filter(
        (msg) =>
          msg.sender !== userEmail && !(msg.readBy || []).includes(userEmail)
      ).length;

      return count;
    },
    [messagesByChat]
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
        });

        return {
          id: docRef.id,
          sender,
          text,
          timestamp: Timestamp.now(),
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
        });

        return {
          id: docRef.id,
          sender,
          text: replyMessage,
          timestamp: Timestamp.now(),
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

        await updateDoc(messageRef, { reactions: updatedReactions });

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

            return { ...msg, reactions: newReactions };
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
    return () => {
      Object.values(listeners.current).forEach((unsubscribe) => unsubscribe());
      listeners.current = {};
    };
  }, []);

  return (
    <MessagesCtx.Provider
      value={{
        messagesByChat,
        subscribeToChatMessages,
        unsubscribeFromChatMessages,
        getMessages,
        getLastMessage,
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
