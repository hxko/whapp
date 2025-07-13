import React, { useLayoutEffect, useState, useRef, useEffect } from "react";
import { sendMessage, fetchMessages } from "@utils/utils";
import { useParams } from "next/navigation";
import { styled, useTheme } from "@mui/material/styles";
import {
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

// Define the type for URL parameters
export type Params = {
  chatId?: string;
};

function ChatScreen() {
  // Hooks and context
  const theme = useTheme();
  const { user } = useAuth();
  const params = useParams<Params>(); // Get params from the router
  const chatId = params?.chatId; // Use optional chaining to safely access chatId
  const router = useRouter();

  // State variables
  const [messages, setMessages] = useState<Messagetype[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Fetch chat partner data
  const {
    data: chatPartner,
    loading: partnerLoading,
    error: partnerError,
  } = useChatPartner(chatId);

  // Fetch messages when chatId changes
  useLayoutEffect(() => {
    if (chatId) {
      const unsubscribe = fetchMessages(chatId, setMessages);
      return () => unsubscribe();
    } else {
      console.error("Chat ID is undefined");
    }
  }, [chatId]);

  // Scroll to the bottom of the message list when new messages arrive
  useLayoutEffect(() => {
    const el = messageListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Handle click outside of emoji picker to close it
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

  // Send a new message
  const handleSendMessage = async () => {
    if (newMessage.trim() && chatId) {
      const senderEmail = user?.email;
      if (senderEmail) {
        await sendMessage(chatId, senderEmail, newMessage);
        setNewMessage(""); // Clear the input field after sending
      } else {
        console.error("User  is not logged in or email is not available.");
      }
    }
  };

  // Handle key down event for sending messages
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent default behavior of Enter key
      handleSendMessage();
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: { native: string }) => {
    setNewMessage((prev) => prev + emoji.native); // Append selected emoji to the message
  };

  // Navigate back to the previous screen
  const handleBackClick = () => {
    router.push("/");
  };

  // Loading and error states for chat partner
  if (partnerLoading) {
    return <Box>Loading chat partner...</Box>;
  }

  if (partnerError) {
    return <Box>Error loading chat partner: {partnerError}</Box>;
  }

  // Group messages by date for better organization
  const groupMessagesByDate = (messages: Messagetype[]) => {
    const groupedMessages: { [key: string]: Messagetype[] } = {};
    const today = new Date();

    messages.forEach((msg) => {
      const messageDate = new Date(msg.timestamp.toDate());
      const diffTime = Math.abs(today.getTime() - messageDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      let label;

      // Determine the label based on how old the message is
      if (diffDays < 7) {
        label = messageDate.toLocaleDateString("en-US", { weekday: "long" });
      } else {
        label = messageDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      // Group messages by the determined label
      if (!groupedMessages[label]) {
        groupedMessages[label] = [];
      }
      groupedMessages[label].push(msg);
    });

    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(messages);

  // Helper function to check if a message is from the current user
  const isCurrentUser = (message: Messagetype) => {
    return message.sender === user?.email;
  };

  // Helper function to render message content
  const renderMessageContent = (msg: Messagetype) => {
    const isUrl = isValidUrl(msg.text);

    if (isUrl) {
      // Render URL preview if the message is a URL
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
      {/* AppBar with chat partner information */}
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
            <IconButton>
              <AttachFile />
            </IconButton>
            <IconButton>
              <MoreVert />
            </IconButton>
          </IconContainer>
        </Toolbar>
      </AppBar>

      {/* Message list */}
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

      {/* Input area for new messages */}
      <InputContainer>
        <OutlinedInput
          id="chat-input"
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

      {/* Emoji picker */}
      {showEmojiPicker && (
        <EmojiPickerContainer ref={emojiPickerRef}>
          <Picker data={data} onEmojiSelect={handleEmojiSelect} />
        </EmojiPickerContainer>
      )}
    </Container>
  );
}

// Function to validate if a string is a URL
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

const EmojiPickerContainer = styled(Box)(() => ({
  position: "absolute",
  bottom: "60px",
  left: "10px",
  zIndex: 1000,
}));

const LabelContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  margin: "10px 0",
}));

const IconContainer = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  marginLeft: "auto",
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: "10px 0",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[700] // Darker background for better contrast
      : theme.palette.grey[600], // Darker background for better contrast
  color: theme.palette.common.white,
  fontWeight: 500, // Slightly bolder text for better readability
}));

const BackButton = styled(IconButton)`
  @media (min-width: 601px) {
    display: none; // Hide on larger screens
  }
`;

// Simple message container that mimics the Message component's alignment behavior
const MessageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  marginBottom: theme.spacing(1),
  marginTop: theme.spacing(1),
  width: "100%",

  // Use CSS classes for alignment instead of props
  "&.current-user": {
    justifyContent: "flex-end", // Align messages from the current user to the right
  },
  "&.other-user": {
    justifyContent: "flex-start", // Align messages from other users to the left
  },

  "& > *": {
    maxWidth: "70%", // Limit width like chat messages
  },
}));
