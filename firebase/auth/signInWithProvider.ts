import {
  signInWithPopup,
  fetchSignInMethodsForEmail,
  AuthProvider,
  AuthCredential,
  linkWithCredential,
  GoogleAuthProvider,
  GithubAuthProvider,
  UserCredential,
  getAdditionalUserInfo,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebase";

interface SignInResult {
  success: boolean;
  error?: string;
  message?: string;
  email?: string;
  existingMethods?: string[];
  needsLinking?: boolean;
  user?: UserCredential["user"];
  isNewUser?: boolean;
  linkedAutomatically?: boolean;
}

const getProviderFromMethod = (method: string): AuthProvider | null => {
  switch (method) {
    case "google.com":
      return new GoogleAuthProvider();
    case "github.com": {
      const provider = new GithubAuthProvider();
      provider.addScope("user:email");
      return provider;
    }
    default:
      return null;
  }
};

const getCredentialFromResult = (
  result: UserCredential
): AuthCredential | null => {
  const googleCredential = GoogleAuthProvider.credentialFromResult(result);
  if (googleCredential) return googleCredential;

  const githubCredential = GithubAuthProvider.credentialFromResult(result);
  if (githubCredential) return githubCredential;

  return null;
};

const getProviderDisplayName = (method: string): string => {
  switch (method) {
    case "google.com":
      return "Google";
    case "github.com":
      return "GitHub";
    case "password":
      return "Email/Password";
    default:
      return method;
  }
};

const refreshUserProfileFromProviders = async () => {
  const user = auth.currentUser;
  if (!user) return;

  await user.reload(); // ensure up-to-date providerData

  const currentProviderId = user.providerData.at(-1)?.providerId;
  const currentProviderData = user.providerData.find(
    (p) => p.providerId === currentProviderId
  );

  const newName = currentProviderData?.displayName ?? null;
  const newPhoto = currentProviderData?.photoURL ?? null;

  await updateProfile(user, {
    displayName: newName,
    photoURL: newPhoto,
  });
};

export const signInWithProvider = async (
  provider: AuthProvider,
  providerName: string
): Promise<SignInResult> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;
    const additionalUserInfo = getAdditionalUserInfo(result);

    const credential = getCredentialFromResult(result);
    if (!credential) {
      return {
        success: false,
        error: "Failed to extract credential from sign-in result.",
      };
    }

    if (!email) {
      return { success: false, error: "No email returned from provider." };
    }

    const existingMethods = await fetchSignInMethodsForEmail(auth, email);
    const alreadyLinked = result.user.providerData.map((p) => p.providerId);
    const unlinkedMethods = existingMethods.filter(
      (method) => !alreadyLinked.includes(method)
    );

    for (const method of unlinkedMethods) {
      const existingProvider = getProviderFromMethod(method);
      if (!existingProvider) continue;

      try {
        await signInWithPopup(auth, existingProvider);

        if (auth.currentUser) {
          const linkedUser = await linkWithCredential(
            auth.currentUser,
            credential
          );

          await refreshUserProfileFromProviders();

          return {
            success: true,
            user: linkedUser.user,
            message: `Your ${providerName} account was linked to your existing ${getProviderDisplayName(
              method
            )} account.`,
            email,
            existingMethods,
            isNewUser: false,
            linkedAutomatically: true,
          };
        }
      } catch (linkError: any) {
        console.error(`Linking with ${method} failed:`, linkError);
        continue;
      }
    }

    await refreshUserProfileFromProviders();

    return {
      success: true,
      message: `Successfully signed in with ${providerName}.`,
      user: result.user,
      email,
      existingMethods,
      isNewUser: additionalUserInfo?.isNewUser,
    };
  } catch (error: any) {
    if (error.code === "auth/account-exists-with-different-credential") {
      const email: string | undefined = error.customData?.email || error.email;
      const pendingCredential = error.credential as AuthCredential | null;

      if (!email || !pendingCredential) {
        console.error(
          "⚠️ Missing email or credential in account-exists-with-different-credential error:",
          { fullError: error, email, credential: error.credential }
        );

        return {
          success: false,
          error:
            "Account conflict detected, but missing required information (email or credential). Please sign in with the previously used provider.",
        };
      }

      try {
        const existingMethods = await fetchSignInMethodsForEmail(auth, email);
        const primaryMethod = existingMethods[0];
        const existingProvider = getProviderFromMethod(primaryMethod);

        if (!existingProvider) {
          return {
            success: false,
            error: `Unsupported provider: ${primaryMethod}`,
          };
        }

        await signInWithPopup(auth, existingProvider);

        if (auth.currentUser) {
          const linkedUser = await linkWithCredential(
            auth.currentUser,
            pendingCredential
          );

          await refreshUserProfileFromProviders();

          return {
            success: true,
            user: linkedUser.user,
            email,
            message: `Your ${getProviderDisplayName(
              provider.providerId
            )} account was linked to your existing ${getProviderDisplayName(
              primaryMethod
            )} account.`,
            existingMethods,
            isNewUser: false,
            linkedAutomatically: true,
          };
        } else {
          return {
            success: false,
            error: "Linking failed: No user is currently signed in.",
          };
        }
      } catch (linkError: any) {
        console.error("Linking after conflict failed:", linkError);
        return {
          success: false,
          error: linkError.message || "Linking after conflict failed.",
        };
      }
    }

    console.error("Sign-in error:", error);
    return {
      success: false,
      error: error.message || "Sign-in failed.",
    };
  }
};

export { refreshUserProfileFromProviders };
