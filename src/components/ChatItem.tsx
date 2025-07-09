// ChatItem.tsx
"use client";
import React from "react";
import { styled } from "@mui/material/styles";
import { Avatar } from "@mui/material";
import { useRouter } from "next/navigation"; // Use Next.js router for navigation
import { useChatPartner } from "@/hooks/useChatPartner"; // Import the useChatPartner hook
import { formatDate } from "@/utils/utils";

interface ChatItemProps {
  chatId: string; // Unique identifier for the chat
}

const ChatItem: React.FC<ChatItemProps> = ({ chatId }) => {
  const router = useRouter(); // Use Next.js router for navigation

  // Use the useChatPartner hook to fetch chat partner data
  const { chatPartner, loading, error } = useChatPartner(chatId);

  const handleClick = () => {
    console.log(`Navigating to chat with ID: ${chatId}`); // Log the chatId
    router.push(`/chat/${chatId}`); // Navigate to the chat view with the chatId
  };

  if (loading) {
    return <ChatItemContainer>Loading...</ChatItemContainer>; // Show loading state
  }

  if (error) {
    return <ChatItemContainer>Error loading chat partner</ChatItemContainer>; // Show error state
  }

  // Format lastSeen date if it exists
  const formattedLastSeen = chatPartner?.lastSeen
    ? formatDate(chatPartner.lastSeen) // Use the formatDate function
    : "Last seen: N/A"; // Fallback if lastSeen is not available

  return (
    <ChatItemContainer onClick={handleClick}>
      <Avatar src={chatPartner?.photoURL} alt={chatPartner?.email} />
      <ChatInfo>
        <ChatPartner>
          {chatPartner?.displayName || chatPartner?.email}
        </ChatPartner>
        <LastSeen>
          <small>Last online: {formattedLastSeen}</small>
        </LastSeen>
      </ChatInfo>
    </ChatItemContainer>
  );
};

export default ChatItem;

// Styled components for ChatItem
const ChatItemContainer = styled("div")`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const ChatInfo = styled("div")``;
const ChatPartner = styled("div")`
  font-weight: bold;
`;
const LastSeen = styled("div")``;
