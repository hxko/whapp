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

interface CachedChatPartner {
  data: ChatPartnerData;
  timestamp: number;
  chatId: string;
}

// Cache storage - using Map for better performance
const chatPartnerCache = new Map<string, CachedChatPartner>();

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 50; // Maximum number of cached chat partners

// Utility functions for cache management
const getCacheKey = (chatId: string, userEmail: string): string => {
  return `${chatId}_${userEmail}`;
};

const isCacheValid = (cachedItem: CachedChatPartner): boolean => {
  const now = Date.now();
  return now - cachedItem.timestamp < CACHE_DURATION;
};

const getCachedChatPartner = (
  chatId: string,
  userEmail: string
): ChatPartnerData | null => {
  const cacheKey = getCacheKey(chatId, userEmail);
  const cachedItem = chatPartnerCache.get(cacheKey);

  if (cachedItem && isCacheValid(cachedItem)) {
    return cachedItem.data;
  }

  // Remove expired cache entry
  if (cachedItem) {
    chatPartnerCache.delete(cacheKey);
  }

  return null;
};

const setCachedChatPartner = (
  chatId: string,
  userEmail: string,
  data: ChatPartnerData
): void => {
  const cacheKey = getCacheKey(chatId, userEmail);

  // Implement LRU-like behavior - remove oldest entries if cache is full
  if (chatPartnerCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = chatPartnerCache.keys().next().value;
    if (oldestKey) {
      chatPartnerCache.delete(oldestKey);
    }
  }

  chatPartnerCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    chatId,
  });
};

// Optional: Function to clear cache (useful for logout, etc.)
export const clearChatPartnerCache = (): void => {
  chatPartnerCache.clear();
};

// Optional: Function to clear cache for specific chat
export const clearChatPartnerCacheForChat = (chatId: string): void => {
  for (const [key, value] of chatPartnerCache.entries()) {
    if (value.chatId === chatId) {
      chatPartnerCache.delete(key);
    }
  }
};

// Optional: Function to invalidate cache for specific user
export const invalidateChatPartnerCache = (email: string): void => {
  for (const [key, value] of chatPartnerCache.entries()) {
    if (value.data.email === email) {
      chatPartnerCache.delete(key);
    }
  }
};

// Main hook with caching
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

      // Check cache first
      const cachedPartner = getCachedChatPartner(chatId, user.email);
      if (cachedPartner) {
        setChatPartner(cachedPartner);
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
            const partnerData: ChatPartnerData = {
              email: partnerEmail,
              displayName: userData?.displayName || userData?.name,
              photoURL: userData?.photoURL,
              lastSeen: userData?.lastSeen || new Date(),
              ...userData, // Include other user data
            };

            // Cache the result
            setCachedChatPartner(chatId, user.email, partnerData);
            setChatPartner(partnerData);
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
