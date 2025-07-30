"use client";

import React, { useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Avatar, Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useChatPartner } from "@/hooks/useChatPartner";
import { useMessages } from "@/context/MessageContext";
import { formatTimestamp } from "@/utils/utils";
import { useAuth } from "@/components/AuthProvider";
import { Chip } from "@mui/material";

interface ChatItemProps {
  chatId: string;
  onChatClick?: (chatId: string) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chatId, onChatClick }) => {
  const router = useRouter();
  const { data: chatPartner, loading, error } = useChatPartner(chatId);

  const {
    subscribeToChatMessages,
    unsubscribeFromChatMessages,
    getLastMessage,
    getUnreadCount,
  } = useMessages();

  const { user } = useAuth();
  const currentUserEmail = user?.email ?? "";

  // Debug: unreadCount berechnen und loggen
  const unreadCount = getUnreadCount(chatId, currentUserEmail);

  useEffect(() => {
    subscribeToChatMessages(chatId);

    return () => {
      unsubscribeFromChatMessages(chatId);
    };
  }, [chatId, subscribeToChatMessages, unsubscribeFromChatMessages]);

  const lastMessage = getLastMessage(chatId);

  const handleClick = () => {
    if (onChatClick) {
      onChatClick(chatId);
    }
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

        <LastMessage variant="body2">
          {lastMessage?.text ?? "No messages yet"}
        </LastMessage>
      </ChatInfo>
    </ChatItemContainer>
  );
};

export default ChatItem;

const ChatItemContainer = styled(Box)(({ theme }) => ({
  maxWidth: "100%",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  transition: "background-color 0.3s",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ChatInfo = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const ChatPartner = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  color: theme.palette.text.primary,
}));

const LastMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
}));

const TopRow = styled("div")({
  position: "relative",
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

const TimestampText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
}));

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
  alignItems: "center",
  gap: theme.spacing(0.2),
}));
