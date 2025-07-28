import { useEffect, useState, useCallback } from "react";
import { User } from "firebase/auth";

interface LinkedProvider {
  providerId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

interface LinkedProvidersState {
  linkedProviders: LinkedProvider[];
  loading: boolean;
  error: string | null;
  count: number;
  isProviderLinked: (providerId: string) => boolean;
  reloadProviders: () => Promise<void>;
}

export const useLinkedProviders = (user: User | null): LinkedProvidersState => {
  const [linkedProviders, setLinkedProviders] = useState<LinkedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = async (u: User) => {
    try {
      await u.reload();
      const updatedUser = u; // after reload, `u.providerData` will be updated
      const providers: LinkedProvider[] = updatedUser.providerData.map(
        (provider) => ({
          providerId: provider.providerId,
          email: provider.email,
          displayName: provider.displayName,
          photoURL: provider.photoURL,
          uid: provider.uid,
        })
      );
      setLinkedProviders(providers);
    } catch (err) {
      console.error("Error loading linked providers", err);
      setError("Failed to load linked providers.");
      setLinkedProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const reloadProviders = useCallback(async () => {
    if (user) {
      setLoading(true);
      await loadProviders(user);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProviders(user);
    } else {
      setLinkedProviders([]);
      setLoading(false);
    }
  }, [user]);

  const isProviderLinked = useCallback(
    (providerId: string): boolean =>
      linkedProviders.some((p) => p.providerId === providerId),
    [linkedProviders]
  );

  return {
    linkedProviders,
    loading,
    error,
    count: linkedProviders.length,
    isProviderLinked,
    reloadProviders,
  };
};
