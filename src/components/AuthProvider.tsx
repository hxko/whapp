// src/components/AuthProvider.tsx
"use client";
import { auth } from "../../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import Loading from "@/components/Loading";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase"; // Import your Firestore instance

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = ["/login", "/register", "/forgot-password"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // Handle navigation based on auth state
      if (!user && !isPublicRoute) {
        router.push("/login");
      } else if (user) {
        // Update lastSeen timestamp in Firestore when user logs in
        const userRef = doc(db, "users", user.uid); // Assuming user document is stored with UID
        await updateDoc(userRef, {
          lastSeen: Timestamp.now(), // Update lastSeen to current timestamp
        });
      }
    });
    return () => unsubscribe();
  }, [router, isPublicRoute]);

  const signOut = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!user && !isPublicRoute) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
