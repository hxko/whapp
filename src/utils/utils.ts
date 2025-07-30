import {
  collection,
  getDoc,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

import EmailValidator from "email-validator";
import type { Chat } from "../types/types";
import type { User } from "firebase/auth";

// Fetch a specific chat document by ID
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatDoc = await getDoc(doc(db, "chats", chatId));
    if (!chatDoc.exists()) return null;

    const data = chatDoc.data();
    return {
      id: chatDoc.id,
      users: data.users,
      createdAt: data.createdAt,
      lastMessage: data.lastMessage,
    } as Chat;
  } catch (error) {
    console.error("Error fetching chat by ID:", error);
    return null;
  }
};

// Fetch user document by email
export const fetchUserData = async (email: string) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;
    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Create a new chat document
export const createChatInDB = async (
  email: string,
  currentUser: User
): Promise<string | undefined> => {
  try {
    const chatRef = await addDoc(collection(db, "chats"), {
      users: [currentUser.email, email],
      createdAt: serverTimestamp(),
    });
    return chatRef.id;
  } catch (error) {
    console.error("Error creating chat:", error);
  }
};
// confirm chat exists
export const chatExists = (
  chats: Chat[],
  email: string,
  currentUserEmail: string
): boolean => {
  return chats.some((chat) => {
    const partnerEmail = getChatPartner(chat, currentUserEmail);
    return partnerEmail === email;
  });
};

// Validate an email address
export const validateEmail = (email: string): boolean =>
  EmailValidator.validate(email);

// Return the other user in the chat (not the current user)
export const getChatPartner = (
  chat: Chat,
  currentUserEmail: string
): string | null =>
  chat.users.find((email) => email !== currentUserEmail) ?? null;

// Format Firestore timestamp for UI display
export const formatTimestamp = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString();
};
