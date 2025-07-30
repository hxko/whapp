import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import { Messagetype } from "@/types/types";
import { useAuth } from "@/components/AuthProvider";
import { useMessages } from "@context/MessageContext";
import MessageTimestamp from "./MessageTimestamp";
import { Box, Typography, Menu, MenuItem, IconButton } from "@mui/material";
import DropdownIcon from "@components/DropdownIcon";
import Checkmarks from "@components/Checkmarks";

const Message = ({
  message,
  chatId,
  onReply,
}: {
  message: Messagetype;
  chatId: string;
  onReply: (message: Messagetype) => void;
}) => {
  const { user } = useAuth();
  const { deleteMessage } = useMessages();
  const isSender = message.sender === user?.email;
  const Container = isSender ? Sender : Recipient;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    await deleteMessage(chatId, message.id);
    handleClose();
  };

  const handleReply = () => {
    onReply(message);
    handleClose();
  };

  return (
    <Container>
      <MessageText isSender={isSender}>
        <TextContent>
          <Typography variant="body1">{message.text}</Typography>
        </TextContent>

        <MetaContainer>
          <TimestampContainer className="timestamp">
            <MessageTimestamp timestamp={message.timestamp} />
          </TimestampContainer>
          <Checkmarks
            message={message}
            isSender={isSender}
            currentUserEmail={user?.email ?? ""}
          />
          <DropdownIcon onClick={handleClick} />
        </MetaContainer>
      </MessageText>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleReply}>Reply</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </Container>
  );
};

export default Message;

const Sender = styled(Box)(({ theme }) => ({
  alignSelf: "flex-end",
  position: "relative",
  "&:hover .MuiIconButton-root": {
    opacity: 1,
  },
}));

const Recipient = styled(Box)(({ theme }) => ({
  alignSelf: "flex-start",
  position: "relative",
  "&:hover .MuiIconButton-root": {
    opacity: 1,
  },
}));

const MessageText = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isSender",
})<{ isSender: boolean }>(({ theme, isSender }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1.25),
  backgroundColor: isSender
    ? theme.palette.mode === "dark"
      ? theme.palette.primary.dark
      : theme.palette.primary.light
    : theme.palette.mode === "dark"
    ? theme.palette.grey[800]
    : theme.palette.common.white,
  boxShadow: theme.shadows[1],
  position: "relative",
  maxWidth: "100%",
  minWidth: "80px",
  "&:hover .timestamp": {
    opacity: 0,
  },
}));

const TextContent = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  overflowWrap: "break-word",
  wordBreak: "break-word",
  whiteSpace: "pre-wrap",
}));

const MetaContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
  alignSelf: "flex-end",
}));

const TimestampContainer = styled(Box)(({ theme }) => ({
  opacity: 1,
  transition: "opacity 0.2s ease-in-out",
}));
