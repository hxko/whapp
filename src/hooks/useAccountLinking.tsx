// ✅ Path: hooks/useAccountLinking.ts

import { useState, useCallback } from "react";
import {
  linkWithPopup,
  linkWithCredential,
  unlink,
  signInWithPopup,
  AuthProvider,
  AuthCredential,
  User,
  UserCredential,
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../../firebase"; // Adjust path as needed
import { signInWithProvider } from "../../firebase/auth/signInWithProvider"; // Import the signInWithProvider function

// Type definitions
interface ErrorState {
  message: string;
  code: string;
  canRetry?: boolean;
}

interface SignInResult {
  success: boolean;
  user?: User;
  isNewUser?: boolean;
  message?: string;
  error?: string;
  needsLinking?: boolean;
  email?: string;
  existingMethods?: string[];
  pendingCredential?: AuthCredential | null;
  newProviderName?: string;
}

interface LinkingResult {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

interface LinkedProvider {
  providerId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

export const useAccountLinking = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorState | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getProviderForId = useCallback(
    (providerId: string): AuthProvider | null => {
      switch (providerId) {
        case "google.com":
          return googleProvider;
        case "github.com":
          return githubProvider;
        default:
          return null;
      }
    },
    []
  );

  const getProviderName = useCallback((providerId: string): string => {
    switch (providerId) {
      case "google.com":
        return "Google";
      case "github.com":
        return "GitHub";
      case "password":
        return "Email/Password";
      default:
        return providerId;
    }
  }, []);

  // Enhanced sign-in with automatic account linking
  const signInWithProviderEnhanced = useCallback(
    async (
      provider: AuthProvider,
      providerName: string
    ): Promise<SignInResult> => {
      setLoading(true);
      setError(null);

      const result = await signInWithProvider(provider, providerName);

      if (result.success) {
        return {
          success: true,
          user: result.user,
          isNewUser: result.isNewUser,
          message: result.message,
        };
      } else if (result.needsLinking) {
        return {
          success: false,
          needsLinking: true,
          email: result.email,
          existingMethods: result.existingMethods,
          message: result.message,
        };
      }

      setError({
        message: result.error || "An unknown error occurred.",
        code: "sign-in-error",
      });
      return {
        success: false,
        error: result.error || "An unknown error occurred.",
      };
    },
    []
  );

  // Link accounts when there's a conflict
  const linkConflictingAccounts = useCallback(
    async (
      email: string,
      existingMethods: string[],
      pendingCredential: AuthCredential | null,
      newProviderName: string
    ): Promise<LinkingResult> => {
      setLoading(true);
      setError(null);

      try {
        const existingProviderId: string = existingMethods[0];
        const existingProvider: AuthProvider | null =
          getProviderForId(existingProviderId);

        if (!existingProvider) {
          const errorMessage =
            "Cannot automatically link this account type. Please sign in with your existing method and link accounts in settings.";
          setError({ message: errorMessage, code: "unsupported-provider" });
          return { success: false, error: errorMessage };
        }

        // Step 1: Sign in with existing provider
        const existingUserResult: UserCredential = await signInWithPopup(
          auth,
          existingProvider
        );

        // Step 2: Link the pending credential to the existing account
        if (pendingCredential) {
          await linkWithCredential(existingUserResult.user, pendingCredential);
        }

        return {
          success: true,
          user: existingUserResult.user,
          message: `Successfully linked your ${newProviderName} account! You can now sign in with either method.`,
        };
      } catch (err: any) {
        console.error("Error linking conflicting accounts:", err);
        const errorMessage = `Failed to link accounts: ${err.message}`;
        setError({ message: errorMessage, code: err.code });
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [getProviderForId]
  );

  // Link a new provider to existing account (for settings page)
  const linkProvider = useCallback(
    async (
      user: User,
      provider: AuthProvider,
      providerName: string
    ): Promise<LinkingResult> => {
      setLoading(true);
      setError(null);

      try {
        await linkWithPopup(user, provider);
        return {
          success: true,
          message: `${providerName} account linked successfully!`,
        };
      } catch (err: any) {
        console.error(`Error linking ${providerName}:`, err);
        const errorMessage = `Failed to link ${providerName} account: ${err.message}`;
        setError({ message: errorMessage, code: err.code });
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Unlink a provider from account
  const unlinkProvider = useCallback(
    async (
      user: User,
      providerId: string,
      providerName: string,
      linkedProviders: LinkedProvider[]
    ): Promise<LinkingResult> => {
      setLoading(true);
      setError(null);

      // Safety check: prevent unlinking if it's the only provider
      if (linkedProviders.length <= 1) {
        const errorMessage =
          "You must have at least one sign-in method linked to your account.";
        setError({ message: errorMessage, code: "insufficient-providers" });
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      try {
        await unlink(user, providerId);
        return {
          success: true,
          message: `${providerName} account unlinked successfully!`,
        };
      } catch (err: any) {
        console.error(`Error unlinking ${providerName}:`, err);
        const errorMessage = `Failed to unlink ${providerName} account: ${err.message}`;
        setError({ message: errorMessage, code: err.code });
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    clearError,
    signInWithProvider: signInWithProviderEnhanced, // Use the enhanced sign-in function
    linkConflictingAccounts,
    linkProvider,
    unlinkProvider,
    getProviderName,
  };
};
