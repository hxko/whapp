import {
  deleteUser,
  reauthenticateWithPopup,
  AuthProvider,
  User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, googleProvider, githubProvider } from "../../firebase";

// Hilfsfunktion: alle Chats des Users finden
const findUserChats = async (email: string) => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("users", "array-contains", email));
  const snapshot = await getDocs(q);
  return snapshot.docs;
};

// Hilfsfunktion: löscht alle Messages in einem Chat
const deleteChatMessages = async (chatId: string) => {
  const messagesRef = collection(db, `chats/${chatId}/messages`);
  const snapshot = await getDocs(messagesRef);

  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

export const deleteUserAccount = async (
  user: User,
  providerId: string,
  deepDelete: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const provider: AuthProvider =
      providerId === "google.com" ? googleProvider : githubProvider;

    // Reauthentication
    await reauthenticateWithPopup(user, provider);

    const userEmail = user.email!;
    const userId = user.uid;

    // 🔥 Deep delete Firestore content
    if (deepDelete) {
      const chatDocs = await findUserChats(userEmail);
      for (const chatDoc of chatDocs) {
        const chatId = chatDoc.id;

        // Lösche alle Messages
        await deleteChatMessages(chatId);

        // Lösche Chat-Dokument
        await deleteDoc(doc(db, "chats", chatId));
      }
    }

    // 🔥 Delete user profile document
    await deleteDoc(doc(db, "users", userId));

    // ❌ Delete Authentication Account
    await deleteUser(user);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
};
