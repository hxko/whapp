// utils.ts
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
} from "firebase/firestore";
import { db } from "../../firebase";
import EmailValidator from "email-validator";
import { Chat } from "../types/types";
import { User } from "firebase/auth";
import { Messagetype } from "types/types";
import { Timestamp } from "firebase/firestore";
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTOKEY as string;

export const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

export const decryptMessage = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatDoc = await getDoc(doc(db, "chats", chatId));
    if (chatDoc.exists()) {
      return {
        id: chatDoc.id,
        users: chatDoc.data().users,
        createdAt: chatDoc.data().createdAt,
        lastMessage: chatDoc.data().lastMessage,
      } as Chat;
    }
    return null;
  } catch (error) {
    console.error("Error fetching chat by ID:", error);
    return null;
  }
};

export const fetchUserData = async (email: string) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    } else {
      console.error(`No such user with email: ${email}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data: ", error);
    return null;
  }
};

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
    console.error("Error creating chat: ", error);
  }
};

export const validateEmail = (email: string): boolean => {
  return EmailValidator.validate(email);
};

export const getChatPartner = (
  chat: Chat,
  currentUserEmail: string
): string | null => {
  return chat.users.find((email) => email !== currentUserEmail) || null;
};

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

export const sendMessage = async (
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
};

export const formatTimestamp = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const isYesterday = (() => {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  })();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString();
};

export const deleteMessage = async (chatId: string, messageId: string) => {
  try {
    const messageRef = doc(db, `chats/${chatId}/messages`, messageId);

    const repliesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(repliesRef, where("replyTo", "==", messageId));
    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    await deleteDoc(messageRef);
    console.log("Message and its replies deleted successfully");
  } catch (error) {
    console.error("Error deleting message: ", error);
  }
};

export const replyToMessage = async (
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
};

export const toggleReaction = async (
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

    Object.keys(updatedReactions).forEach((key) => {
      if (updatedReactions[key].length === 0) {
        delete updatedReactions[key];
      }
    });

    await updateDoc(messageRef, { reactions: updatedReactions });
  } catch (error) {
    console.error("Error toggling emoji reaction: ", error);
  }
};
