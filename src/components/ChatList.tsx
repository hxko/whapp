// ChatList.tsx
import React from "react";
import { styled } from "@mui/material/styles";
import ChatItem from "./ChatItem"; // Import the ChatItem component
import { getChatPartner } from "@/utils/utils";
import { useAuth } from "@/components/AuthProvider"; // Import the useAuth hook to access user via AuthProvider

interface Chat {
  id: string; // The unique identifier for the chat
  users: string[]; // An array of user emails involved in the chat
}

interface ChatListProps {
  chats: Chat[]; // Array of chat objects
  onChatClick?: (chatId: string) => void; // Add the onChatClick prop
}

const ChatList: React.FC<ChatListProps> = ({ chats, onChatClick }) => {
  const { user } = useAuth(); // Access user from AuthProvider

  return (
    <ChatsContainer>
      {chats.map((chat) => {
        // Ensure user?.email is defined before calling getChatPartner
        const chatPartnerEmail = user?.email
          ? getChatPartner(chat, user.email)
          : null;

        // If chatPartnerEmail is null, you can choose to skip rendering or handle it accordingly
        if (!chatPartnerEmail) {
          return null; // Skip rendering if no chat partner is found
        }

        return (
          <ChatItem
            key={chat.id}
            chatId={chat.id} // Pass the chat ID for navigation
            onChatClick={onChatClick} // Pass the onChatClick function to ChatItem
          />
        );
      })}
    </ChatsContainer>
  );
};

export default ChatList;

// Styled components for ChatList
const ChatsContainer = styled("div")(({ theme }) => ({
  padding: theme.spacing(1.25),
  maxWidth: "100%",
}));
