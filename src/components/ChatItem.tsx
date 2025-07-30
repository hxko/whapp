"use client";

import React, { useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Avatar, Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useChatPartner } from "@/hooks/useChatPartner"; // Custom hook to get info about the other chat user
import { useMessages } from "@/context/MessageContext"; // Custom context/hook for managing chat messages
import { formatTimestamp } from "@/utils/utils"; // Utility to format timestamps nicely
import { Timestamp } from "firebase/firestore"; // Firebase Firestore timestamp type
import { useAuth } from "@/components/AuthProvider"; // Hook to get current logged-in user
import { Chip } from "@mui/material";

// Define the props type for this component: expects a chatId string to know which chat to display
interface ChatItemProps {
  chatId: string;
  onChatClick?: (chatId: string) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chatId, onChatClick }) => {
  const router = useRouter(); // Next.js router to programmatically navigate
  const { data: chatPartner, loading, error } = useChatPartner(chatId);
  // useChatPartner fetches the other user’s data (e.g. name, photo) for this chat
  // loading and error let us handle UI states accordingly

  const {
    subscribeToChatMessages, // Starts listening for messages in this chat
    unsubscribeFromChatMessages, // Stops listening when component unmounts
    getLastMessage, // Returns the last message in this chat
    getUnreadCount,
    lastReadTimestamps,
  } = useMessages();

  const { user } = useAuth(); // Get the current logged-in user
  const currentUserEmail = user?.email ?? ""; // Extract user email or fallback to empty string
  const unreadCount = getUnreadCount(
    chatId,
    currentUserEmail,
    lastReadTimestamps
  );

  // useEffect to subscribe to chat messages on mount and unsubscribe on unmount
  useEffect(() => {
    subscribeToChatMessages(chatId);
    return () => unsubscribeFromChatMessages(chatId);
  }, [chatId, subscribeToChatMessages, unsubscribeFromChatMessages]);

  // Get the last message of the chat for display
  const lastMessage = getLastMessage(chatId);

  // Handle click on the chat item:
  // 1. Mark chat as read with the current timestamp of last message
  // 2. Navigate to the chat's dedicated page
  const handleClick = () => {
    if (onChatClick) {
      onChatClick(chatId);
    }
  };

  // Display loading state while fetching chat partner data
  if (loading) return <ChatItemContainer>Loading...</ChatItemContainer>;

  // Display error if chat partner data failed to load
  if (error)
    return <ChatItemContainer>Error loading chat partner</ChatItemContainer>;

  return (
    // Main container for one chat item: clickable, shows avatar, name, last message, timestamp
    <ChatItemContainer onClick={handleClick}>
      {/* Avatar for chat partner */}
      <Avatar src={chatPartner?.photoURL} alt={chatPartner?.email} />

      {/* Container for chat text info */}
      <ChatInfo>
        {/* Top row with chat partner name and last message timestamp */}
        <TopRow>
          <ChatPartner variant="body1">
            {chatPartner?.displayName || chatPartner?.email}
          </ChatPartner>
          <TimestampAndChipWrapper>
            {lastMessage?.timestamp && (
              <TimestampText variant="caption">
                {formatTimestamp(lastMessage.timestamp)}
              </TimestampText>
            )}
            {unreadCount > 0 && (
              <UnreadChip label={unreadCount} size="small" color="primary" />
            )}
          </TimestampAndChipWrapper>
        </TopRow>

        {/* Last message text snippet or placeholder if no messages */}
        <LastMessage variant="body2">
          {lastMessage?.text ?? "No messages yet"}
        </LastMessage>
      </ChatInfo>
    </ChatItemContainer>
  );
};

export default ChatItem;

// --- Styled components below to keep styling isolated and consistent ---

// Container for the entire chat item with flex layout, spacing, and hover effect
const ChatItemContainer = styled(Box)(({ theme }) => ({
  maxWidth: "100%",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1), // Consistent gap between avatar and text
  marginBottom: theme.spacing(1), // Space below each chat item
  padding: theme.spacing(1), // Padding inside the container
  borderRadius: theme.shape.borderRadius, // Rounded corners from theme
  cursor: "pointer", // Cursor indicates clickable
  transition: "background-color 0.3s", // Smooth hover transition
  "&:hover": {
    backgroundColor: theme.palette.action.hover, // MUI theme hover background color
  },
}));

// Wrapper around chat text info, takes all remaining horizontal space
const ChatInfo = styled(Box)({
  flex: 1,
  minWidth: 0,
});

// Style for chat partner's name: bold and primary text color
const ChatPartner = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  color: theme.palette.text.primary,
}));

// Style for last message text snippet: smaller font, secondary color, ellipsis if overflow
const LastMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
}));

// Top row container: flex row with space between name and timestamp
const TopRow = styled("div")({
  position: "relative",
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

// Timestamp text: small font size and secondary text color
const TimestampText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
}));

// Styled MUI Chip mit kleinem Abstand und rundem Stil
const UnreadChip = styled(Chip)(({ theme }) => ({
  height: 20,
  minWidth: 20,
  fontWeight: "bold",
  fontSize: "0.75rem",
  padding: "0 6px",
}));

const TimestampAndChipWrapper = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  right: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(0.2),
}));
