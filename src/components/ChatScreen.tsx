import React, { useLayoutEffect, useState, useRef, useEffect } from "react";
import {
  sendMessage,
  fetchMessages,
  replyToMessage,
  toggleReaction,
} from "@utils/utils";
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
  Stack,
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
import ReplyMessage from "./ReplyMessage";
import ReplyPreview from "./ReplyPreview";
import Loading from "./Loading";
import QuickEmojiPicker from "@/components/QuickEmojiPicker";

// Define the type for URL parameters
export type Params = {
  chatId: string;
};

function ChatScreen() {
  // Hooks and context
  const theme = useTheme();
  const { user } = useAuth();
  const currentUserEmail = user?.email!;
  const params = useParams<Params>(); // Get params from the router
  const chatId = params?.chatId as string; // Use optional chaining to safely access chatId
  const router = useRouter();

  // State variables
  const [messages, setMessages] = useState<Messagetype[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const [replyMessage, setReplyMessage] = useState<Messagetype | null>(null); // State to hold the message being replied to
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState<string | null>(
    null
  );
  const quickEmojiPickerRef = useRef<HTMLDivElement | null>(null);
  const [prevMessageCount, setPrevMessageCount] = useState(0);

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

  // Scroll to bottom when new messages are added
  useLayoutEffect(() => {
    const el = messageListRef.current;

    // Only scroll if the number of messages increased (new message added)
    if (el && messages.length > prevMessageCount) {
      el.scrollTop = el.scrollHeight;
    }

    // Update the previous count
    setPrevMessageCount(messages.length);
  }, [messages, prevMessageCount]);

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

  // handling click outside of QuickEmojiPicker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        quickEmojiPickerRef.current &&
        !quickEmojiPickerRef.current.contains(event.target as Node)
      ) {
        setActiveEmojiPickerId(null);
      }
    };

    if (activeEmojiPickerId) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeEmojiPickerId]);
  const handleSendMessage = async () => {
    if (newMessage.trim() && chatId) {
      const senderEmail = currentUserEmail;
      if (senderEmail) {
        // If replying to a message, include reply information
        if (replyMessage) {
          await replyToMessage(
            chatId,
            replyMessage.id,
            newMessage,
            senderEmail
          );
          setReplyMessage(null); // Clear the reply message after sending
        } else {
          await sendMessage(chatId, senderEmail, newMessage);
        }
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
    return <Loading />;
  }

  if (partnerError) {
    return <Box>Error loading chat partner: {partnerError}</Box>;
  }
  // reply to a message
  const handleReply = (message: Messagetype) => {
    setReplyMessage(message); // Set the message to reply to
    // Focus message input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0); // wait one tick to ensure render completes
  };
  // Function to calculate total reactions
  const calculateTotalReactions = (reactions: { [key: string]: string[] }) => {
    return Object.values(reactions).reduce(
      (total, users) => total + users.length,
      0
    );
  };
  //select reaction emoji
  const handleSelectReaction = async (
    messageId: string,
    emoji: { native: string }
  ) => {
    if (chatId && user?.email) {
      await toggleReaction(chatId, messageId, emoji.native, user.email);
      setActiveEmojiPickerId(null);
    }
  };
  // Group messages by date for better organization
  const groupMessagesByDate = (messages: Messagetype[]) => {
    const groupedMessages: { [key: string]: Messagetype[] } = {};
    const today = new Date();

    messages.forEach((msg) => {
      const messageDate = new Date(msg.timestamp.toDate());
      const isToday = messageDate.toDateString() === today.toDateString(); // Check if the message is from today
      let label;

      // Determine the label based on how old the message is
      if (isToday) {
        label = "Today"; // Set label to "Today" if the message is from today
      } else {
        const diffTime = Math.abs(today.getTime() - messageDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
          label = messageDate.toLocaleDateString("en-US", { weekday: "long" });
        } else {
          label = messageDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      }

      // Group messages by the determined label
      if (!groupedMessages[label]) {
        groupedMessages[label] = [];
      }
      groupedMessages[label].push(msg);
    });

    // Remove labels with no messages
    Object.keys(groupedMessages).forEach((key) => {
      if (groupedMessages[key].length === 0) {
        delete groupedMessages[key];
      }
    });

    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(messages);

  // Helper function to check if a message is from the current user
  const isCurrentUser = (message: Messagetype) => {
    return message.sender === currentUserEmail;
  };

  const renderMessageBody = (msg: Messagetype) => {
    const isUrl = isValidUrl(msg.text);

    if (isUrl && chatId) {
      return (
        <UrlPreviewComponent
          url={msg.text}
          timestamp={msg.timestamp}
          chatId={chatId}
          messageId={msg.id}
          onReply={handleReply}
        />
      );
    } else {
      return <Typography>{msg.text}</Typography>;
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

      {/* Message list */}
      <MessageList ref={messageListRef}>
        {Object.entries(groupedMessages).map(([label, msgs]) => (
          <LabelContainer key={label}>
            <StyledChip label={label} variant="filled" />
            {msgs.map((msg) => {
              // Only render top-level messages (i.e., not replies)
              if (msg.replyTo) return null;

              const replies = messages.filter((m) => m.replyTo === msg.id);
              const isUrl = isValidUrl(msg.text);

              return (
                <React.Fragment key={msg.id}>
                  {/* Render URL preview or regular message */}
                  <MessageContainer
                    className={
                      isCurrentUser(msg) ? "current-user" : "other-user"
                    }
                    // Remove onMouseEnter and onMouseLeave - CSS handles this now
                  >
                    {/* Render URL preview or regular message */}
                    {isUrl && chatId ? (
                      <UrlPreviewComponent
                        url={msg.text}
                        timestamp={msg.timestamp}
                        chatId={chatId}
                        messageId={msg.id}
                        onReply={handleReply}
                      />
                    ) : (
                      <Message
                        message={msg}
                        chatId={chatId!}
                        onReply={handleReply}
                      />
                    )}

                    {/* Emoji Button – now uses CSS class for hover behavior */}
                    <IconButton
                      size="small"
                      className="emoji-hover-button" // Add this class
                      onClick={() =>
                        setActiveEmojiPickerId(
                          activeEmojiPickerId === msg.id ? null : msg.id
                        )
                      }
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: 1,
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <EmojiEmotionsIcon fontSize="small" />
                    </IconButton>

                    {/* Quick reactionEmoji Picker – positioned next to emoji button */}
                    {activeEmojiPickerId === msg.id && (
                      <QuickEmojiPickerContainer
                        ref={quickEmojiPickerRef}
                        isCurrentUser={isCurrentUser(msg)}
                      >
                        <QuickEmojiPicker
                          onSelect={(emoji) =>
                            handleSelectReaction(msg.id, emoji)
                          }
                          onClose={() => setActiveEmojiPickerId(null)}
                        />
                      </QuickEmojiPickerContainer>
                    )}
                  </MessageContainer>
                  {/* Reactions – Bottom Right */}
                  {msg.reactions &&
                    Object.entries(msg.reactions).length > 0 && (
                      <ReactionsContainer isCurrentUser={isCurrentUser(msg)}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                          <Chip
                            title={users.join(", ") || "No users"}
                            key={emoji}
                            label={`${emoji} ${
                              users.length > 1 ? users.length : ""
                            }`}
                            size="small"
                            variant={
                              users.includes(currentUserEmail)
                                ? "filled"
                                : "outlined"
                            }
                            onClick={() =>
                              toggleReaction(
                                chatId,
                                msg.id,
                                emoji,
                                currentUserEmail
                              )
                            }
                          />
                        ))}
                        {/* Total Reactions Count TODO*/}
                        {/* <Typography
                          variant="caption"
                          sx={{ alignSelf: "center" }}
                        >
                          {calculateTotalReactions(msg.reactions)}
                        </Typography> */}
                      </ReactionsContainer>
                    )}

                  {/* Render replies */}
                  {replies.map((reply) => {
                    const originalMessage = messages.find(
                      (m) => m.id === reply.replyTo
                    );
                    const isOriginalSender = originalMessage
                      ? isCurrentUser(originalMessage)
                      : false;

                    return (
                      <ReplyMessage
                        key={reply.id}
                        message={reply}
                        renderBody={renderMessageBody}
                        isOriginalSender={isOriginalSender}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </LabelContainer>
        ))}
      </MessageList>

      {/* Render the reply message if it exists */}
      {/* TODO: dont render timestamp, use 100% width, use padding or margins for UrlPreviewComponent */}
      {replyMessage && (
        <ReplyPreview
          message={replyMessage}
          onCancel={() => setReplyMessage(null)}
          chatId={chatId}
        />
      )}

      {/* Input area for new messages */}
      <InputContainer>
        <OutlinedInput
          inputRef={inputRef}
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

const EmojiPickerContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: "60px",
  marginLef: theme.spacing(2),
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

const BackButton = styled(IconButton)(({ theme }) => ({
  display: "inline-flex", // Show by default
  [theme.breakpoints.up("md")]: {
    display: "none", // Hide on large screens and up
  },
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column", // Stack messages vertically
  marginBottom: theme.spacing(1),
  marginTop: theme.spacing(1),

  [theme.breakpoints.up("lg")]: {
    maxWidth: "70%",
  },
  position: "relative", // Important for absolute positioning of emoji button

  // Hide emoji button by default
  "& .emoji-hover-button": {
    opacity: 0,
    visibility: "hidden",
    transition: "opacity 0.2s ease, visibility 0.2s ease",
  },

  // Show emoji button on hover
  "&:hover .emoji-hover-button": {
    opacity: 1,
    visibility: "visible",
  },

  // Position emoji button for current user (left side of message)
  "&.current-user .emoji-hover-button": {
    position: "absolute",
    top: "50%",
    left: "-35px", // Position to the left of the message
    transform: "translateY(-50%)",
    zIndex: 1,
  },

  // Position emoji button for other user (right side of message)
  "&.other-user .emoji-hover-button": {
    position: "absolute",
    top: "50%",
    right: "-35px", // Position to the right of the message
    transform: "translateY(-50%)",
    zIndex: 1,
  },
  // Align current user messages to the right
  "&.current-user": {
    alignSelf: "flex-end",
  },

  // Align other user messages to the left
  "&.other-user": {
    alignSelf: "flex-start",
  },
}));

const ReactionsContainer = styled(Stack)<{ isCurrentUser: boolean }>(
  ({ theme, isCurrentUser }) => ({
    alignSelf: isCurrentUser ? "flex-end" : "flex-start",
    fontSize: "0.8rem",
    padding: theme.spacing(0.5),
    display: "flex",
    flexDirection: "row",
    gap: theme.spacing(0.5),
    flexFlow: "wrap",
    transform: "translateY(-14px)",
    [theme.breakpoints.up("lg")]: {
      maxWidth: "70%",
    },
  })
);

const QuickEmojiPickerContainer = styled(Box)<{ isCurrentUser: boolean }>(
  ({ theme, isCurrentUser }) => ({
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1000,
    right: isCurrentUser ? "200px" : "none",
    left: isCurrentUser ? "none" : "0px",
  })
);
