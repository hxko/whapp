"use client";
import React, { useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Avatar, Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useChatPartner } from "@/hooks/useChatPartner";
import { useMessages } from "@/context/MessageContext";
import { formatTimestamp } from "@/utils/utils";

// Props
interface ChatItemProps {
  chatId: string;
}

const ChatItem: React.FC<ChatItemProps> = ({ chatId }) => {
  const router = useRouter();
  const { data: chatPartner, loading, error } = useChatPartner(chatId);
  const {
    subscribeToChatMessages,
    unsubscribeFromChatMessages,
    getLastMessage,
  } = useMessages();

  // Subscribe on mount
  useEffect(() => {
    subscribeToChatMessages(chatId);
    return () => unsubscribeFromChatMessages(chatId);
  }, [chatId, subscribeToChatMessages, unsubscribeFromChatMessages]);

  const lastMessage = getLastMessage(chatId);

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
          {lastMessage?.timestamp && (
            <TimestampText variant="caption">
              {formatTimestamp(lastMessage.timestamp)}
            </TimestampText>
          )}
        </TopRow>
        <LastMessage variant="body2">
          {lastMessage?.text ?? "No messages yet"}
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
