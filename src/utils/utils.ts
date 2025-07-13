// utils.ts
import {
  collection,
  getDoc,
  doc,
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

/// Messages
// Function to send a message
export const sendMessage = async (
  chatId: string,
  sender: string,
  text: string
) => {
  try {
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    await addDoc(messagesRef, {
      sender,
      text,
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
      messages.push({
        id: doc.id,
        sender: data.sender, // Ensure this property exists
        text: data.text, // Ensure this property exists
        timestamp: data.timestamp || Timestamp.now(), // Use current date if null
      });
    });
    setMessages(messages);
  });
};
