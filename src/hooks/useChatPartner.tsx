import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { fetchUserData, getChatById, getChatPartner } from "@/utils/utils";
import { Timestamp } from "firebase/firestore";

interface ChatPartnerData {
  email: string;
  displayName?: string;
  photoURL?: string;
  lastSeen?: Timestamp | null;
}

export const useChatPartner = (
  chatId: string | undefined
): { data: ChatPartnerData | null; loading: boolean; error: string | null } => {
  const { user } = useAuth();
  const [data, setData] = useState<ChatPartnerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!chatId || !user?.email) return;

      setLoading(true);
      try {
        const chat = await getChatById(chatId);
        if (chat) {
          const partnerEmail = getChatPartner(chat, user.email);
          if (partnerEmail) {
            const userData = await fetchUserData(partnerEmail);
            const avatarUrl = userData?.photoURL;

            let photoURL: string | undefined = undefined;

            // Only try to fetch avatar if avatarUrl exists
            if (avatarUrl) {
              try {
                const proxyUrl = `/api/avatarProxy?url=${encodeURIComponent(
                  avatarUrl
                )}`;
                const avatarResponse = await fetch(proxyUrl);

                if (avatarResponse.ok) {
                  const avatarBlob = await avatarResponse.blob();
                  photoURL = URL.createObjectURL(avatarBlob);
                } else {
                  console.warn("Failed to fetch avatar via proxy");
                }
              } catch (avatarError) {
                console.warn("Error fetching avatar:", avatarError);
                // photoURL remains undefined, Avatar component will show default
              }
            }
            setData({
              email: partnerEmail,
              displayName: userData?.displayName || userData?.name,
              photoURL: photoURL,
              lastSeen: userData?.lastSeen || null,
            });
          }
        }
      } catch (err) {
        console.error(err); // Log the error for debugging
        setError("Failed to load chat partner");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chatId, user?.email]);

  return { data, loading, error };
};
