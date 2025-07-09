// hooks/useChatPartner.ts
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { fetchUserData, getChatById, getChatPartner } from "@utils/utils";

interface ChatPartnerData {
  email: string;
  displayName?: string;
  photoURL?: string;
  lastSeen: Date;
  // Add other user properties as needed
}

interface UseChatPartnerReturn {
  chatPartner: ChatPartnerData | null;
  loading: boolean;
  error: string | null;
}

// Single hook that works with chatId - whether from Chat object or URL params
export const useChatPartner = (
  chatId: string | undefined
): UseChatPartnerReturn => {
  const { user } = useAuth();
  const [chatPartner, setChatPartner] = useState<ChatPartnerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatPartner = async () => {
      if (!chatId || !user?.email) {
        setChatPartner(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get the chat document to find the partner
        const chat = await getChatById(chatId);
        if (chat) {
          // Use getChatPartner utility function to find the partner email
          const partnerEmail = getChatPartner(chat, user.email);

          if (partnerEmail) {
            const userData = await fetchUserData(partnerEmail);
            setChatPartner({
              email: partnerEmail,
              displayName: userData?.displayName || userData?.name,
              photoURL: userData?.photoURL,
              lastSeen: userData?.lastSeen || new Date(),
              ...userData, // Include other user data
            });
          } else {
            setChatPartner(null);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch chat partner"
        );
        setChatPartner(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChatPartner();
  }, [chatId, user?.email]);

  return { chatPartner, loading, error };
};
