// types.ts
import { Timestamp } from "firebase/firestore";

export interface Chat {
  id: string; // The unique identifier for the chat
  users: string[]; // An array of user emails involved in the chat
  createdAt?: Timestamp; // Prefer Timestamp from Firestore for consistency, instead of Date
}

export type Messagetype = {
  id: string; // Firestore document ID
  sender: string; // Email of the sender
  text: string; // Message content (decrypted text)
  timestamp: Timestamp; // Timestamp of when the message was sent
  replyTo?: string; // Optional ID of the message being replied to
  reactions: {
    [emoji: string]: string[]; // array of user emails who reacted with this emoji
  };
  readBy?: string[]; // list of users who read the message
  deliveredTo?: string[]; // track delivery status
  updatedAt?: Timestamp; // update when reactions are added
};

export type MarkAsReadFunction = (
  chatId: string,
  messageId: string,
  userEmail: string
) => void;

export type MarkAsDeliveredFunction = (
  chatId: string,
  messageId: string,
  userEmail: string
) => void;
