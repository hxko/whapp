// hooks/useLastSeen.ts
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore"; // Import necessary Firestore functions
import { db } from "../../firebase"; // Import the Firestore instance
import { Timestamp } from "firebase/firestore";

export const useLastSeen = (email: string | undefined): Timestamp | null => {
  const [lastSeen, setLastSeen] = useState<Timestamp | null>(null);

  useEffect(() => {
    if (!email) return;

    // Create a query to fetch the user document based on email
    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );

    // Set up a real-time listener
    const unsubscribe = onSnapshot(
      userQuery,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            setLastSeen(userData?.lastSeen || null);
          });
        } else {
          console.warn(`No document found for email: ${email}`);
          setLastSeen(null); // Set lastSeen to null if the document does not exist
        }
      },
      (error) => {
        console.error("Error fetching documents: ", error);
      }
    );

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [email]);

  return lastSeen;
};
