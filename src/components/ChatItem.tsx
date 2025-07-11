"use client";
import { styled } from "@mui/material/styles";
import { Avatar, Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation"; // Use Next.js router for navigation
import { useChatPartner } from "@/hooks/useChatPartner"; // Import the useChatPartner hook

interface ChatItemProps {
  chatId: string; // Unique identifier for the chat
}

const ChatItem: React.FC<ChatItemProps> = ({ chatId }) => {
  const router = useRouter(); // Use Next.js router for navigation

  // Use the useChatPartner hook to fetch chat partner data
  const { data: chatPartner, loading, error } = useChatPartner(chatId);

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
  gap: "10px",
  marginBottom: "10px",
  padding: "10px",
  borderRadius: "5px",
  cursor: "pointer",
  transition: "background-color 0.3s",
  "&:hover": {
    backgroundColor: theme.palette.action.hover, // Use MUI's hover color
  },
}));

const ChatInfo = styled(Box)``;

const ChatPartner = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
}));
