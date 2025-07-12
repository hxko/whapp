import { useEffect, useState } from "react"; // Import React hooks
import { auth, db } from "../../firebase"; // Import Firebase auth and Firestore database instances
import { collection, getDocs, query, where } from "firebase/firestore"; // Import Firestore functions
import { Chat } from "types/types"; // Import the Chat interface

// Custom hook to fetch chats for a specific user
const useChats = (userEmail: string | null) => {
  const [chats, setChats] = useState<Chat[]>([]); // State to hold the list of chats

  // Function to fetch chats for the user
  const getUserChats = async () => {
    if (!userEmail) return []; // Return an empty array if no user email is provided

    const chatsRef = collection(db, "chats"); // Reference to the "chats" collection in Firestore
    const chatsQuery = query(
      chatsRef,
      where("users", "array-contains", userEmail) // Query to find chats containing the user
    );

    const chatSnapshot = await getDocs(chatsQuery); // Execute the query and get the snapshot
    // Map the snapshot to an array of Chat objects
    return chatSnapshot.docs.map((doc) => ({
      id: doc.id, // Document ID
      ...doc.data(), // Spread the document data
    })) as Chat[];
  };

  // Effect to fetch chats whenever the userEmail changes
  useEffect(() => {
    const fetchChats = async () => {
      const userChats = await getUserChats(); // Fetch chats for the user
      setChats(userChats); // Update the state with the fetched chats
    };

    fetchChats(); // Call the fetch function
  }, [userEmail]); // Dependency array to re-run effect when userEmail changes

  return chats; // Return the list of chats
};

export default useChats; // Export the custom hook
