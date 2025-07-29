"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { Messagetype } from "types/types";
import { decryptMessage } from "@utils/utils";

interface MessagesContextType {
  messagesByChat: Record<string, Messagetype[]>;
  subscribeToChatMessages: (chatId: string) => void;
  unsubscribeFromChatMessages: (chatId: string) => void;
  getMessages: (chatId: string) => Messagetype[] | undefined;
  getLastMessage: (chatId: string) => Messagetype | undefined;
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
  const listeners = React.useRef<Record<string, () => void>>({});

  const subscribeToChatMessages = useCallback((chatId: string) => {
    if (listeners.current[chatId]) return;

    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: Messagetype[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sender: data.sender,
          text: decryptMessage(data.text),
          timestamp: data.timestamp,
          replyTo: data.replyTo || null,
          reactions: data.reactions || {},
        };
      });

      setMessagesByChat((prev) => ({ ...prev, [chatId]: messages }));
    });

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
      }}
    >
      {children}
    </MessagesCtx.Provider>
  );
};
