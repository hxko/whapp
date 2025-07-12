// src/components/AuthProvider.tsx
"use client";

import { auth } from "../../firebase"; // Import Firebase authentication
import { onAuthStateChanged, User } from "firebase/auth"; // Import Firebase auth methods
import {
  ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { useRouter, usePathname } from "next/navigation"; // Import Next.js navigation hooks
import Loading from "@/components/Loading"; // Import loading component
import { doc, updateDoc, Timestamp } from "firebase/firestore"; // Import Firestore methods
import { db } from "../../firebase"; // Import your Firestore instance

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null; // Current authenticated user
  loading: boolean; // Loading state
  signOut: () => Promise<void>; // Function to sign out
}

// Create the authentication context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * AuthProvider component to manage authentication state.
 * Provides user information and loading state to its children.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // State for the current user
  const [loading, setLoading] = useState(true); // State for loading status
  const router = useRouter(); // Next.js router for navigation
  const pathname = usePathname(); // Current pathname

  // Define public routes that do not require authentication
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  const isPublicRoute = publicRoutes.includes(pathname); // Check if the current route is public

  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user); // Update user state
      setLoading(false); // Set loading to false

      // Handle navigation based on authentication state
      if (!user && !isPublicRoute) {
        router.push("/login"); // Redirect to login if not authenticated
      } else if (user) {
        // Update lastSeen timestamp in Firestore when user logs in
        const userRef = doc(db, "users", user.uid); // Reference to the user document
        await updateDoc(userRef, {
          lastSeen: Timestamp.now(), // Update lastSeen to current timestamp
        });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router, isPublicRoute]);

  // Function to sign out the user
  const signOut = async () => {
    try {
      await auth.signOut(); // Sign out from Firebase
      router.push("/login"); // Redirect to login page
    } catch (error) {
      console.error("Error signing out:", error); // Log any errors
    }
  };

  // Show loading component while loading or if user is not authenticated and not on a public route
  if (loading || (!user && !isPublicRoute)) {
    return <Loading />;
  }

  // Provide authentication context to children
  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
