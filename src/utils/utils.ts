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
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase"; // Import your Firestore instance
import EmailValidator from "email-validator"; // Import email validation library
import { Chat } from "../types/types"; // Import the Chat interface
import { User } from "firebase/auth"; // Import User type from Firebase
import { Messagetype } from "types/types";
import { Timestamp } from "firebase/firestore"; // Import Firestore Timestamp
import CryptoJS from "crypto-js"; // Import the crypto-js library

// Define a secret key for encryption/decryption (this should be securely managed)
const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTOKEY as string; // TODO: Replace with a secure key management solution

// Function to encrypt a message
const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

// Function to decrypt a message
const decryptMessage = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Utility function to get chat by ID
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatDoc = await getDoc(doc(db, "chats", chatId));
    if (chatDoc.exists()) {
      return {
        id: chatDoc.id,
        users: chatDoc.data().users,
        createdAt: chatDoc.data().createdAt,
        lastMessage: chatDoc.data().lastMessage,
        // Add other chat properties as needed
      } as Chat;
    }
    return null;
  } catch (error) {
    console.error("Error fetching chat by ID:", error);
    return null;
  }
};

// Function to fetch user data based on email
export const fetchUserData = async (email: string) => {
  try {
    const usersRef = collection(db, "users"); // Reference to the users collection
    const q = query(usersRef, where("email", "==", email)); // Query to find the user by email
    const querySnapshot = await getDocs(q); // Fetch the user documents

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]; // Get the first document
      return userDoc.data(); // Return user data if it exists
    } else {
      console.error(`No such user with email: ${email}`);
      return null; // Return null if the user does not exist
    }
  } catch (error) {
    console.error("Error fetching user data: ", error); // Log the error
    return null; // Return null or handle the error as needed
  }
};

// Create chat in Firestore database
export const createChatInDB = async (
  email: string,
  currentUser: User
): Promise<string | undefined> => {
  try {
    const chatRef = await addDoc(collection(db, "chats"), {
      users: [currentUser.email, email],
      createdAt: serverTimestamp(),
    });

    return chatRef.id; // return the new chat ID
  } catch (error) {
    console.error("Error creating chat: ", error);
  }
};

// Function to validate email
export const validateEmail = (email: string): boolean => {
  return EmailValidator.validate(email);
};

// Utility function to get chat partner
export const getChatPartner = (
  chat: Chat,
  currentUserEmail: string
): string | null => {
  return chat.users.find((email) => email !== currentUserEmail) || null;
};

// Utility function to check if a chat already exists
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

// Function to send a message
export const sendMessage = async (
  chatId: string,
  sender: string,
  text: string
) => {
  try {
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const encryptedText = encryptMessage(text); // Encrypt the message before sending
    await addDoc(messagesRef, {
      sender,
      text: encryptedText, // Store the encrypted message
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending message: ", error);
  }
};

// Function to fetch messages
export const fetchMessages = (
  chatId: string,
  setMessages: React.Dispatch<React.SetStateAction<Messagetype[]>>
) => {
  const messagesRef = collection(db, `chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy("timestamp"));
  return onSnapshot(q, (querySnapshot) => {
    const messages: Messagetype[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const decryptedText = decryptMessage(data.text); // Decrypt the message after receiving
      messages.push({
        id: doc.id,
        sender: data.sender, // Ensure this property exists
        text: decryptedText, // Use the decrypted message
        timestamp: data.timestamp || Timestamp.now(), // Use current date if null
        replyTo: data.replyTo || null,
        reactions: data.reactions || {},
      });
    });
    setMessages(messages);
  });
};

// Function to delete a message and its replies
export const deleteMessage = async (chatId: string, messageId: string) => {
  try {
    const messageRef = doc(db, `chats/${chatId}/messages`, messageId); // Reference to the message document

    // Fetch replies associated with the message
    const repliesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(repliesRef, where("replyTo", "==", messageId)); // Query to find replies
    const querySnapshot = await getDocs(q); // Fetch replies

    // Delete each reply
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises); // Wait for all replies to be deleted

    // Now delete the original message
    await deleteDoc(messageRef); // Delete the message document
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
) => {
  try {
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const encryptedText = encryptMessage(replyMessage); // Encrypt the reply message
    await addDoc(messagesRef, {
      sender,
      text: encryptedText, // Store the encrypted reply message
      timestamp: serverTimestamp(),
      replyTo: messageId, // Reference to the original message being replied to
    });
    console.log(`Replied to message ${messageId} in chat ${chatId}`);
  } catch (error) {
    console.error("Error replying to message: ", error);
  }
};

import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Message } from "@mui/icons-material";

// Function to toggle emoji reaction
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

    // Remove empty emoji arrays
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
