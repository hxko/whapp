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
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Messagetype } from "types/types";
import { decryptMessage } from "@utils/utils";

interface MessagesContextType {
  messagesByChat: Record<string, Messagetype[]>;
  subscribeToChatMessages: (chatId: string) => void;
  unsubscribeFromChatMessages: (chatId: string) => void;
  getMessages: (chatId: string) => Messagetype[] | undefined;
  getLastMessage: (chatId: string) => Messagetype | undefined;
  getUnreadCount: (
    chatId: string,
    userEmail: string,
    lastReadTimestamps: Record<string, Record<string, Timestamp>>
  ) => number;
  markChatAsRead: (
    chatId: string,
    userEmail: string,
    timestamp: Timestamp
  ) => Promise<void>;
  lastReadTimestamps: Record<string, Record<string, Timestamp>>;
}

const MessagesCtx = createContext<MessagesContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessagesCtx);
  if (!context) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
};

interface MessagesProviderProps {
  children: ReactNode;
}

export const MessagesProvider = ({ children }: MessagesProviderProps) => {
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, Messagetype[]>
  >({});

  const [lastReadTimestamps, setLastReadTimestamps] = useState<
    Record<string, Record<string, Timestamp>>
  >({});

  const listeners = React.useRef<Record<string, () => void>>({});

  const subscribeToChatMessages = useCallback(async (chatId: string) => {
    if (listeners.current[chatId]) return;

    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: Messagetype[] = querySnapshot.docs.map((doc) => {
        const data = doc.data() as Messagetype;
        const decryptedText = decryptMessage(data.text);
        return {
          ...data,
          id: doc.id,
          text: decryptedText,
          timestamp: data.timestamp,
        };
      });

      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: messages,
      }));
    });

    const lastReadForChat = await fetchLastReadTimestamps(chatId);
    setLastReadTimestamps((prev) => ({ ...prev, [chatId]: lastReadForChat }));

    listeners.current[chatId] = unsubscribe;
  }, []);

  const unsubscribeFromChatMessages = useCallback((chatId: string) => {
    if (listeners.current[chatId]) {
      listeners.current[chatId]();
      delete listeners.current[chatId];

      setMessagesByChat((prev) => {
        const copy = { ...prev };
        delete copy[chatId];
        return copy;
      });
    }
  }, []);

  const getMessages = useCallback(
    (chatId: string) => messagesByChat[chatId],
    [messagesByChat]
  );

  const getLastMessage = useCallback(
    (chatId: string) => {
      const messages = messagesByChat[chatId];
      if (!messages || messages.length === 0) return undefined;
      return messages[messages.length - 1]; // messages are ordered by timestamp
    },
    [messagesByChat]
  );

  const fetchLastReadTimestamps = async (chatId: string) => {
    const chatDoc = await getDoc(doc(db, "chats", chatId));
    if (chatDoc.exists()) {
      return chatDoc.data().lastRead || {};
    }
    return {};
  };

  const markChatAsRead = async (
    chatId: string,
    userEmail: string,
    timestamp: Timestamp
  ) => {
    const chatRef = doc(db, "chats", chatId);

    // Update Firestore
    await updateDoc(chatRef, {
      [`lastRead.${userEmail}`]: timestamp,
    });

    // Update local state
    setLastReadTimestamps((prev) => ({
      ...prev,
      [chatId]: {
        ...(prev[chatId] || {}),
        [userEmail]: timestamp,
      },
    }));
  };

  const getUnreadCount = useCallback(
    (chatId: string, userEmail: string): number => {
      const messages = messagesByChat[chatId];
      const lastRead = lastReadTimestamps[chatId]?.[userEmail]; // Use local state

      if (!messages || messages.length === 0) return 0;
      if (!lastRead) return messages.length;

      return messages.filter(
        (msg) => msg.timestamp?.toMillis() > lastRead.toMillis()
      ).length;
    },
    [messagesByChat, lastReadTimestamps] // Add lastReadTimestamps as dependency
  );

  useEffect(() => {
    return () => {
      // Cleanup all listeners on unmount
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
        markChatAsRead,
        lastReadTimestamps,
      }}
    >
      {children}
    </MessagesCtx.Provider>
  );
};
