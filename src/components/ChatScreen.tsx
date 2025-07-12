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
  IconButton,
} from "@mui/material";
import { Messagetype } from "types/types";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { useAuth } from "@/components/AuthProvider";
import { useChatPartner } from "@/hooks/useChatPartner";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Message from "@components/Message";
import MoreVert from "@mui/icons-material/MoreVert";
import AttachFile from "@mui/icons-material/AttachFile";
import TimeAgo from "react-timeago";
import OutlinedInput from "@mui/material/OutlinedInput";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import UrlPreviewComponent from "@/components/UrlPreviewComponent";

export type Params = {
  chatId?: string;
};

function ChatScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { chatId } = useParams<Params>();
  const router = useRouter();
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
        console.error("User is not logged in or email is not available.");
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

  const handleBackClick = () => {
    router.push("/");
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

  // Helper function to check if message is from current user
  const isCurrentUser = (message: Messagetype) => {
    return message.sender === user?.email;
  };

  // Helper function to render message content
  const renderMessageContent = (msg: Messagetype) => {
    const isUrl = isValidUrl(msg.text);

    if (isUrl) {
      // Create a message-like structure for URL preview with same alignment logic
      return (
        <MessageContainer
          className={isCurrentUser(msg) ? "current-user" : "other-user"}
        >
          <UrlPreviewComponent url={msg.text} timestamp={msg.timestamp} />
        </MessageContainer>
      );
    } else {
      // Render normal message
      return <Message message={msg} />;
    }
  };

  return (
    <Container>
      <AppBar position="static">
        <Toolbar>
          <BackButton onClick={handleBackClick}>
            <ArrowBackIcon />
          </BackButton>
          <Avatar src={chatPartner?.photoURL} alt={chatPartner?.email} />
          <Box sx={{ marginLeft: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              {chatPartner?.email}
            </Typography>
            <Typography variant="body2" color={theme.palette.text.secondary}>
              Last active:{" "}
              {chatPartner?.lastSeen ? (
                <TimeAgo date={chatPartner?.lastSeen.toDate()} />
              ) : (
                "Unknown"
              )}
            </Typography>
          </Box>
          <Box flexGrow={1} />
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
              <React.Fragment key={msg.id}>
                {renderMessageContent(msg)}
              </React.Fragment>
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
        <Button onClick={handleSendMessage} variant="contained" color="primary">
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

const isValidUrl = (string: string) => {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z0-9\\-]+\\.)+[a-z]{2,})|" + // domain name
      "localhost|" + // localhost
      "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|" + // IP address
      "\\[?[a-f0-9:\\.]+\\])" + // IPv6
      "(\\:\\d+)?(\\/[-a-z0-9%_.~+]*)*" + // port and path
      "(\\?[;&a-z0-9%_.~+=-]*)?" + // query string
      "(\\#[-a-z0-9_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(string);
};

export default ChatScreen;

// Styled components for layout and styling
const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.background.default
      : theme.palette.grey[100],
}));

const MessageList = styled(Box)(({ theme }) => ({
  flex: 1,
  height: "100%",
  overflowY: "auto",
  padding: "20px 30px",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.background.paper
      : theme.palette.grey[200],
  "&::-webkit-scrollbar": {
    display: "none",
  },
  scrollbarWidth: "none",
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(2),
  background: theme.palette.background.paper,
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
      : theme.palette.grey[400],
  color: theme.palette.common.white,
}));

const BackButton = styled(IconButton)`
  @media (min-width: 601px) {
    display: none;
  }
`;

// Simple message container that mimics the Message component's alignment behavior
const MessageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  margin: `${theme.spacing(1)} 0`,
  width: "100%",

  // Use CSS classes for alignment instead of props
  "&.current-user": {
    justifyContent: "flex-end",
  },
  "&.other-user": {
    justifyContent: "flex-start",
  },

  "& > *": {
    maxWidth: "70%", // Limit width like chat messages
  },
}));
