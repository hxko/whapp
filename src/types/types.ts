// types.ts
import { Timestamp } from "firebase/firestore";
export interface Chat {
  id: string; // The unique identifier for the chat
  users: string[]; // An array of user emails involved in the chat
  createdAt?: Date; // An optional timestamp indicating when the chat was created
}
export type Messagetype = {
  id: string; // Firestore document ID
  sender: string; // Email of the sender
  text: string; // Message content
  timestamp: Timestamp; // Timestamp of when the message was sent
  replyTo?: string; // Optional ID of the message being replied to
  reactions: {
    [emoji: string]: string[]; // array of user emails who reacted with this emoji
  };
};
