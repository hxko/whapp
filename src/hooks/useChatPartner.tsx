// hooks useChatPartner.ts
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { fetchUserData, getChatById, getChatPartner } from "@/utils/utils";

interface ChatPartnerData {
  email: string;
  displayName?: string;
  photoURL?: string;
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
            setData({
              email: partnerEmail,
              displayName: userData?.displayName || userData?.name,
              photoURL: userData?.photoURL,
            });
          }
        }
      } catch (err) {
        setError("Failed to load chat partner");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chatId, user?.email]);

  return { data, loading, error };
};
