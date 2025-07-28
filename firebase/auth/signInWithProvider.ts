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
      provider.addScope("user:email"); // Ensure GitHub returns email
      return provider;
    }
    default:
      return null;
  }
};

// Extrahiere die AuthCredential aus dem UserCredential für bekannte Provider
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

    // Versuche automatisch unlinked Provider zu verlinken
    for (const method of unlinkedMethods) {
      const existingProvider = getProviderFromMethod(method);
      if (!existingProvider) continue;

      try {
        // Benutzer mit dem bereits bestehenden Provider anmelden
        await signInWithPopup(auth, existingProvider);

        if (auth.currentUser) {
          // Neues Credential zum aktuellen User verlinken
          const linkedUser = await linkWithCredential(
            auth.currentUser,
            credential
          );

          return {
            success: true,
            user: linkedUser.user,
            message: `Dein ${providerName} Account wurde mit ${getProviderDisplayName(
              method
            )} verlinkt.`,
            email,
            existingMethods,
            isNewUser: false,
            linkedAutomatically: true,
          };
        }
      } catch (linkError: any) {
        console.error(`Linking mit ${method} fehlgeschlagen:`, linkError);
        continue;
      }
    }

    return {
      success: true,
      message: `Erfolgreich mit ${providerName} angemeldet.`,
      user: result.user,
      email,
      existingMethods,
      isNewUser: additionalUserInfo?.isNewUser,
    };
  } catch (error: any) {
    // Behandlung von Account-Konflikten
    if (error.code === "auth/account-exists-with-different-credential") {
      const email: string | undefined = error.customData?.email || error.email;
      const pendingCredential = error.credential as AuthCredential | null;

      if (!email || !pendingCredential) {
        console.error(
          "⚠️ Fehlende Email oder Credential im account-exists-with-different-credential Fehler:",
          { fullError: error, email, credential: error.credential }
        );

        return {
          success: false,
          error:
            "Account-Konflikt aufgetreten, aber es fehlen notwendige Infos (Email oder Credential). Bitte melde dich mit dem zuvor genutzten Anbieter an.",
        };
      }

      try {
        const existingMethods = await fetchSignInMethodsForEmail(auth, email);
        const primaryMethod = existingMethods[0];
        const existingProvider = getProviderFromMethod(primaryMethod);

        if (!existingProvider) {
          return {
            success: false,
            error: `Nicht unterstützter Anbieter: ${primaryMethod}`,
          };
        }

        // Stille Anmeldung mit dem bestehenden Account
        await signInWithPopup(auth, existingProvider);

        if (auth.currentUser) {
          // Verlinke den neuen Credential mit dem existierenden User
          const linkedUser = await linkWithCredential(
            auth.currentUser,
            pendingCredential
          );
          return {
            success: true,
            user: linkedUser.user,
            email,
            message: `Dein ${getProviderDisplayName(
              provider.providerId
            )} Account wurde mit deinem bestehenden ${getProviderDisplayName(
              primaryMethod
            )} Account verlinkt.`,
            existingMethods,
            isNewUser: false,
            linkedAutomatically: true,
          };
        } else {
          return {
            success: false,
            error: "Verlinkung fehlgeschlagen: Kein Benutzer angemeldet.",
          };
        }
      } catch (linkError: any) {
        console.error("Verlinkung nach Konflikt fehlgeschlagen:", linkError);
        return {
          success: false,
          error:
            linkError.message || "Verlinkung nach Konflikt fehlgeschlagen.",
        };
      }
    }

    console.error("Anmeldefehler:", error);
    return {
      success: false,
      error: error.message || "Anmeldung fehlgeschlagen.",
    };
  }
};
