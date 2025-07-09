// hooks/useChats.ts
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase"; // Import Firebase auth instance
import { collection, getDocs, query, where } from "firebase/firestore"; // Import Firestore functions
import { Chat } from "types/types"; // Import the Chat interface

const useChats = (userEmail: string | null) => {
  const [chats, setChats] = useState<Chat[]>([]);

  const getUserChats = async () => {
    if (!userEmail) return [];
    const chatsRef = collection(db, "chats");
    const chatsQuery = query(
      chatsRef,
      where("users", "array-contains", userEmail)
    );
    const chatSnapshot = await getDocs(chatsQuery);
    return chatSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
  };

  useEffect(() => {
    const fetchChats = async () => {
      const userChats = await getUserChats();
      setChats(userChats);
    };
    fetchChats();
  }, [userEmail]);

  return chats;
};

export default useChats;
