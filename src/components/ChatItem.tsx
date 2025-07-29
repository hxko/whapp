"use client";
import React from "react";
import { styled } from "@mui/material/styles"; // Import styled from MUI
import { Avatar, Box, Typography } from "@mui/material"; // Import MUI components
import { useRouter } from "next/navigation"; // Use Next.js router for navigation
import { useChatPartner } from "@/hooks/useChatPartner"; // Import the useChatPartner hook
import { useEffect, useState } from "react";
import { getLastMessage, formatTimestamp } from "@/utils/utils"; // Import your new util
import { Timestamp } from "firebase/firestore";

// Define the props for the ChatItem component
interface ChatItemProps {
  chatId: string; // Unique identifier for the chat
}

/**
 * ChatItem component displays a single chat item with partner information.
 * It allows navigation to the chat view when clicked.
 */

const ChatItem: React.FC<ChatItemProps> = ({ chatId }) => {
  const router = useRouter();
  const { data: chatPartner, loading, error } = useChatPartner(chatId);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<Timestamp | null>(null);

  useEffect(() => {
    const loadLastMessage = async () => {
      const msg = await getLastMessage(chatId);
      if (msg) {
        setLastMessage(msg.text);
        setLastTimestamp(msg.timestamp);
      }
    };
    loadLastMessage();
  }, [chatId]);

  const handleClick = () => {
    router.push(`/chat/${chatId}`);
  };

  if (loading) return <ChatItemContainer>Loading...</ChatItemContainer>;
  if (error)
    return <ChatItemContainer>Error loading chat partner</ChatItemContainer>;

  return (
    <ChatItemContainer onClick={handleClick}>
      <Avatar src={chatPartner?.photoURL} alt={chatPartner?.email} />
      <ChatInfo>
        <TopRow>
          <ChatPartner variant="body1">
            {chatPartner?.displayName || chatPartner?.email}
          </ChatPartner>
          {lastTimestamp && (
            <TimestampText variant="caption">
              {formatTimestamp(lastTimestamp)}
            </TimestampText>
          )}
        </TopRow>
        <LastMessage variant="body2">
          {lastMessage ?? "No messages yet"}
        </LastMessage>
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

const LastMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));
const TopRow = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

const TimestampText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
}));
