// types.ts
import { Timestamp } from "firebase/firestore";

export interface Chat {
  id: string; // The unique identifier for the chat
  users: string[]; // An array of user emails involved in the chat
  createdAt?: Date; // An optional timestamp indicating when the chat was created
}

export interface Attachment {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export type Messagetype = {
  id: string; // Firestore document ID
  sender: string; // Email of the sender
  text: string; // Message content
  timestamp: Timestamp; // Timestamp of when the message was sent
  attachment?: Attachment; // Optional file attachment field
};
