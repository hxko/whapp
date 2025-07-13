"use client";

import { styled } from "@mui/material/styles"; // Import styled from MUI
import { Avatar, Box, Typography } from "@mui/material"; // Import MUI components
import { useRouter } from "next/navigation"; // Use Next.js router for navigation
import { useChatPartner } from "@/hooks/useChatPartner"; // Import the useChatPartner hook

// Define the props for the ChatItem component
interface ChatItemProps {
  chatId: string; // Unique identifier for the chat
}

/**
 * ChatItem component displays a single chat item with partner information.
 * It allows navigation to the chat view when clicked.
 */
const ChatItem: React.FC<ChatItemProps> = ({ chatId }) => {
  const router = useRouter(); // Use Next.js router for navigation

  // Use the useChatPartner hook to fetch chat partner data
  const { data: chatPartner, loading, error } = useChatPartner(chatId);

  // Handle click event to navigate to the chat view
  const handleClick = () => {
    router.push(`/chat/${chatId}`); // Navigate to the chat view with the chatId
  };

  // Show loading state while fetching data
  if (loading) {
    return <ChatItemContainer>Loading...</ChatItemContainer>;
  }

  // Show error state if fetching fails
  if (error) {
    return <ChatItemContainer>Error loading chat partner</ChatItemContainer>;
  }

  return (
    <ChatItemContainer onClick={handleClick}>
      <Avatar src={chatPartner?.photoURL} alt={chatPartner?.email} />
      <ChatInfo>
        <ChatPartner variant="body1">
          {chatPartner?.displayName || chatPartner?.email}
        </ChatPartner>
        {/* You can add any additional information here if needed */}
      </ChatInfo>
    </ChatItemContainer>
  );
};

export default ChatItem;

// Styled components for ChatItem
const ChatItemContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1), // Use theme spacing for consistent gap
  marginBottom: theme.spacing(1), // Use theme spacing for margin
  padding: theme.spacing(1), // Use theme spacing for padding
  borderRadius: theme.shape.borderRadius, // Use theme shape for border radius
  cursor: "pointer",
  transition: "background-color 0.3s",
  "&:hover": {
    backgroundColor: theme.palette.action.hover, // Use MUI's hover color
  },
}));

const ChatInfo = styled(Box)({
  flex: 1, // Allow ChatInfo to take available space
});

const ChatPartner = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  color: theme.palette.text.primary, // Use theme color for text
}));
