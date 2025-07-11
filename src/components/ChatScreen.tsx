import React, { useLayoutEffect, useState, useRef, useEffect } from "react";
import { sendMessage, fetchMessages } from "@utils/utils";
import { useParams } from "next/navigation";
import { styled, useTheme } from "@mui/material/styles";
import {
  TextField,
  Button,
  InputAdornment,
  Chip,
  Box,
  AppBar,
  Toolbar,
  Avatar,
  Typography,
  IconButton, // Import IconButton
} from "@mui/material";
import { Messagetype } from "types/types";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { useAuth } from "@/components/AuthProvider";
import { useChatPartner } from "@/hooks/useChatPartner";
import { useLastSeen } from "@/hooks/useLastSeen";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Message from "@components/Message";
import MoreVert from "@mui/icons-material/MoreVert"; // Import MoreVert icon
import AttachFile from "@mui/icons-material/AttachFile"; // Import AttachFile icon
import TimeAgo from "react-timeago"; // Import TimeAgo
import OutlinedInput from "@mui/material/OutlinedInput";

export type Params = {
  chatId?: string;
};

function ChatScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { chatId } = useParams<Params>();
  const [messages, setMessages] = useState<Messagetype[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: chatPartner,
    loading: partnerLoading,
    error: partnerError,
  } = useChatPartner(chatId);

  // Use the useLastSeen hook to get the last seen timestamp
  const lastSeen = useLastSeen(chatPartner?.email);

  useLayoutEffect(() => {
    if (chatId) {
      const unsubscribe = fetchMessages(chatId, setMessages);
      return () => unsubscribe();
    } else {
      console.error("Chat ID is undefined");
    }
  }, [chatId]);

  useLayoutEffect(() => {
    const el = messageListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && chatId) {
      const senderEmail = user?.email;
      if (senderEmail) {
        await sendMessage(chatId, senderEmail, newMessage);
        setNewMessage("");
      } else {
        console.error("User  is not logged in or email is not available.");
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  if (partnerLoading) {
    return <Box>Loading chat partner...</Box>;
  }

  if (partnerError) {
    return <Box>Error loading chat partner: {partnerError}</Box>;
  }

  const groupMessagesByDate = (messages: Messagetype[]) => {
    const groupedMessages: { [key: string]: Messagetype[] } = {};
    const today = new Date();
    messages.forEach((msg) => {
      const messageDate = new Date(msg.timestamp.toDate());
      const diffTime = Math.abs(today.getTime() - messageDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      let label;
      if (diffDays < 7) {
        label = messageDate.toLocaleDateString("en-US", { weekday: "long" });
      } else {
        label = messageDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      if (!groupedMessages[label]) {
        groupedMessages[label] = [];
      }
      groupedMessages[label].push(msg);
    });
    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Container>
      <AppBar position="static">
        <Toolbar>
          <Avatar src={chatPartner?.photoURL} alt={chatPartner?.email} />
          <Box sx={{ marginLeft: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              {chatPartner?.email}
            </Typography>
            <Typography variant="body2" color={theme.palette.text.secondary}>
              Last active:{" "}
              {lastSeen ? <TimeAgo date={lastSeen.toDate()} /> : "Unknown"}
            </Typography>
          </Box>
          <Box flexGrow={1} /> {/* This will push the icons to the right */}
          <IconContainer>
            <IconButton onClick={() => console.log("Attach file clicked")}>
              <AttachFile />
            </IconButton>
            <IconButton onClick={() => console.log("More options clicked")}>
              <MoreVert />
            </IconButton>
          </IconContainer>
        </Toolbar>
      </AppBar>
      <MessageList ref={messageListRef}>
        {Object.entries(groupedMessages).map(([label, msgs]) => (
          <LabelContainer key={label}>
            <StyledChip label={label} variant="filled" />
            {msgs.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
          </LabelContainer>
        ))}
      </MessageList>
      <InputContainer>
        <OutlinedInput
          style={{ marginRight: 10 }}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          fullWidth
          multiline
          onKeyDown={handleKeyDown}
          startAdornment={
            <InputAdornment position="start">
              <EmojiEmotionsIcon
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                style={{ cursor: "pointer" }}
              />
            </InputAdornment>
          }
        />
        <Button
          onClick={handleSendMessage}
          variant="contained"
          color="primary" // Use primary color for the button
        >
          Send
        </Button>
      </InputContainer>

      {showEmojiPicker && (
        <EmojiPickerContainer ref={emojiPickerRef}>
          <Picker data={data} onEmojiSelect={handleEmojiSelect} />
        </EmojiPickerContainer>
      )}
    </Container>
  );
}

export default ChatScreen;

// Styled components for layout and styling
const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.background.default
      : theme.palette.grey[100], // Use theme background color for dark mode
}));

const MessageList = styled(Box)(({ theme }) => ({
  flex: 1,
  height: "100%",
  overflowY: "auto",
  padding: "20px 30px",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.background.paper
      : theme.palette.grey[200], // Use theme background color for dark mode
  "&::-webkit-scrollbar": {
    display: "none", // For Chrome, Safari, and Opera
  },
  scrollbarWidth: "none", // For Firefox
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(2),
  background: theme.palette.background.paper, // Use theme background color
}));

const EmojiPickerContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: "60px",
  left: "10px",
  zIndex: 1000,
}));

const LabelContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  margin: "10px 0",
}));

const IconContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginLeft: "auto",
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: "10px 0",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[800]
      : theme.palette.grey[400], // Use theme primary color for dark mode
  color: theme.palette.common.white, // Use theme common white color
}));
