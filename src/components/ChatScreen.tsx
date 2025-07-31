import React, { useLayoutEffect, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MessageObserver from "@components/MessageObserver";

// Material-UI imports grouped by category
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
  OutlinedInput,
} from "@mui/material";

// Material-UI icons
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import MoreVert from "@mui/icons-material/MoreVert";
import AttachFile from "@mui/icons-material/AttachFile";

// Third-party library imports
import TimeAgo from "react-timeago";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { doc, getDoc } from "firebase/firestore";

// Internal imports - utils and services
import { db } from "../../firebase";

// Internal imports - components
import Message from "@components/Message";
import UrlPreviewComponent from "@/components/UrlPreviewComponent";
import ReplyMessage from "@components/ReplyMessage";
import ReplyPreview from "@components/ReplyPreview";
import Loading from "@components/Loading";
import QuickEmojiPicker from "@/components/QuickEmojiPicker";

// Internal imports - hooks and context
import { useAuth } from "@/components/AuthProvider";
import { useChatPartner } from "@/hooks/useChatPartner";
import { useMessages } from "@/context/MessageContext";

// Types
import { Messagetype } from "@/types";

// Define the type for URL parameters
export type Params = {
  chatId: string;
};

/**
 * ChatScreen Component
 *
 * Main chat interface component that handles:
 * - Real-time message display and sending
 * - Message reactions and replies
 * - URL preview rendering
 * - Chat partner information display
 * - Message grouping by date
 */
function ChatScreen() {
  // ========================================
  // HOOKS AND CONTEXT SETUP
  // ========================================

  const theme = useTheme();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    messagesByChat,
    sendMessage,
    replyToMessage,
    toggleReaction,
    markMessageAsRead,
    markMessageAsDelivered,
  } = useMessages();

  // Extract current user email and chat ID from URL params
  const currentUserEmail = user?.email!;
  const chatId = searchParams?.get("chatId");

  // Early return if no chat is selected
  if (!chatId) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Typography variant="h6" color="text.secondary">
          No chat selected
        </Typography>
      </Box>
    );
  }

  // Message context for real-time message management
  const { getMessages, subscribeToChatMessages, unsubscribeFromChatMessages } =
    useMessages();

  // Get messages from context instead of local state
  const messages = getMessages(chatId) || [];

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Message input and UI state
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyMessage, setReplyMessage] = useState<Messagetype | null>(null);
  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState<string | null>(
    null
  );
  const [prevMessageCount, setPrevMessageCount] = useState(0);

  // ========================================
  // REFS FOR DOM MANIPULATION
  // ========================================

  // Refs for scrolling and click-outside detection
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const quickEmojiPickerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * When the user opens a chat or new messages arrive, this effect:
   * 1. Marks all messages not yet delivered to this user as "delivered" (adds user to `deliveredTo`).
   * 2. Marks all messages not yet read by this user as "read" (adds user to `readBy`).
   * This ensures that message bubbles update with accurate status (like checkmarks),
   * and Firestore reflects the user's read/delivery state in real time.
   */
  // useEffect(() => {
  //   if (chatId && user?.email && messagesByChat[chatId]?.length) {
  //     markMessagesAsDelivered(chatId, user.email);
  //     markMessagesAsRead(chatId, user.email);
  //   }
  // }, [chatId, messagesByChat[chatId]?.length, user?.email]);

  // ========================================
  // CUSTOM HOOKS FOR DATA FETCHING
  // ========================================

  // Fetch chat partner information
  const {
    data: chatPartner,
    loading: partnerLoading,
    error: partnerError,
  } = useChatPartner(chatId);

  // ========================================
  // EFFECTS FOR LIFECYCLE MANAGEMENT
  // ========================================

  /**
   * Effect: Chat validation and message subscription
   * Validates user access to the chat and subscribes to real-time messages
   */
  useEffect(() => {
    if (!chatId || !user?.email) return;

    const validateAccess = async () => {
      try {
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);

        // Check if chat exists
        if (!chatSnap.exists()) {
          router.replace("/?error=notfound");
          return;
        }

        // Check if user has access to this chat
        const chatData = chatSnap.data();
        if (!chatData.users.includes(user.email)) {
          router.replace("/?error=unauthorized");
          return;
        }

        // Subscribe to real-time messages
        subscribeToChatMessages(chatId);
      } catch (error) {
        console.error("Error validating chat access:", error);
        router.replace("/?error=general");
      }
    };

    validateAccess();

    // Cleanup: Unsubscribe when component unmounts or chatId changes
    return () => {
      unsubscribeFromChatMessages(chatId);
    };
  }, [
    chatId,
    user?.email,
    router,
    subscribeToChatMessages,
    unsubscribeFromChatMessages,
  ]);

  /**
   * Effect: Auto-scroll to bottom when new messages arrive
   * Ensures the chat always shows the latest messages
   */
  useLayoutEffect(() => {
    const messageContainer = messageListRef.current;

    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    // Track message count for read status updates
    setPrevMessageCount(messages.length);
  }, [messages.length, chatId]);

  /**
   * Effect: Handle click outside emoji picker to close it
   * Provides better UX by closing picker when user clicks elsewhere
   */
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
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  /**
   * Effect: Handle click outside quick emoji picker to close it
   * Similar to above but for the quick reaction picker
   */
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
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeEmojiPickerId]);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle sending a new message or reply
   * Supports both regular messages and replies to existing messages
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUserEmail) {
      console.error("Missing required data for sending message");
      return;
    }

    try {
      if (replyMessage) {
        // Send as a reply to an existing message
        await replyToMessage(
          chatId,
          replyMessage.id,
          newMessage,
          currentUserEmail
        );
        setReplyMessage(null); // Clear reply state
      } else {
        // Send as a regular message
        await sendMessage(chatId, currentUserEmail, newMessage);
      }

      // Clear input after successful send
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  /**
   * Handle Enter key press to send message
   * Provides keyboard shortcut for better UX
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handle emoji selection from picker
   * Appends selected emoji to the current message
   */
  const handleEmojiSelect = (emoji: { native: string }) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  /**
   * Handle reply action on a message
   * Sets up reply state and focuses input
   */
  const handleReply = (message: Messagetype) => {
    setReplyMessage(message);

    // Focus input after state update
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  /**
   * Handle reaction selection on a message
   * Toggles emoji reactions on messages
   */
  const handleSelectReaction = async (
    messageId: string,
    emoji: { native: string }
  ) => {
    if (!chatId || !user?.email) return;

    try {
      await toggleReaction(chatId, messageId, emoji.native, user.email);
      setActiveEmojiPickerId(null);
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Group messages by date for better organization
   * Creates date labels like "Today", "Yesterday", weekdays, or full dates
   */
  const groupMessagesByDate = (messages: Messagetype[], locale = "en-US") => {
    const groupedMessages: { [key: string]: Messagetype[] } = {};
    const now = new Date();

    // Calculate date boundaries
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // Calculate start of the current week (Monday)
    const startOfWeek = new Date(startOfToday);
    const day = startOfToday.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

    messages.forEach((msg) => {
      if (!msg.timestamp) return; // Skip messages without timestamps

      const messageDate = new Date(msg.timestamp.toDate());
      const msgDateOnly = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      );

      // Determine appropriate date label
      let label: string;
      if (msgDateOnly.getTime() === startOfToday.getTime()) {
        label = "Today";
      } else if (msgDateOnly.getTime() === startOfYesterday.getTime()) {
        label = "Yesterday";
      } else if (msgDateOnly >= startOfWeek && msgDateOnly < startOfToday) {
        // Show weekday name for current week
        label = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
          messageDate
        );
      } else {
        // Show full date for older messages
        label = new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(messageDate);
      }

      // Group messages under the appropriate label
      if (!groupedMessages[label]) {
        groupedMessages[label] = [];
      }
      groupedMessages[label].push(msg);
    });

    return groupedMessages;
  };

  /**
   * Check if a message is from the current user
   * Used for message alignment and styling
   */
  const isCurrentUser = (message: Messagetype) => {
    return message.sender === currentUserEmail;
  };

  /**
   * Calculate total number of reactions on a message
   * Currently unused but available for future features
   */
  const calculateTotalReactions = (reactions: { [key: string]: string[] }) => {
    return Object.values(reactions).reduce(
      (total, users) => total + users.length,
      0
    );
  };

  /**
   * Render message body with URL preview support
   * Handles both regular text messages and URL previews
   */
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

  // ========================================
  // LOADING AND ERROR STATES
  // ========================================

  if (partnerLoading) {
    return <Loading />;
  }

  if (partnerError) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Typography color="error">
          Error loading chat partner: {partnerError}
        </Typography>
      </Box>
    );
  }

  // ========================================
  // DATA PREPARATION FOR RENDERING
  // ========================================

  // Group messages by date using browser locale
  const userLocale = navigator.language || "en-US";
  const groupedMessages = groupMessagesByDate(messages, userLocale);

  // ========================================
  // MAIN COMPONENT RENDER
  // ========================================

  return (
    <Container>
      {/* ===== CHAT HEADER WITH PARTNER INFO ===== */}
      <AppBar position="static">
        <Toolbar>
          <Avatar src={chatPartner?.photoURL} alt={chatPartner?.email} />
          <Box sx={{ marginLeft: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              {chatPartner?.email}
            </Typography>
            <Typography variant="body2" color={theme.palette.text.secondary}>
              Last active:{" "}
              {chatPartner?.lastSeen ? (
                <TimeAgo date={chatPartner.lastSeen.toDate()} />
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

      {/* ===== MESSAGE LIST WITH DATE GROUPING ===== */}
      <MessageList ref={messageListRef}>
        {Object.entries(groupedMessages).map(([dateLabel, messagesInGroup]) => (
          <LabelContainer key={dateLabel}>
            {/* Date separator chip */}
            <StyledChip label={dateLabel} variant="filled" />

            {/* Messages for this date */}
            {messagesInGroup.map((msg) => {
              // Skip reply messages - they're rendered under their parent messages
              if (msg.replyTo) return null;

              // Find all replies to this message
              const replies = messages.filter((m) => m.replyTo === msg.id);
              const isUrl = isValidUrl(msg.text);

              return (
                <React.Fragment key={msg.id}>
                  {/* ===== MAIN MESSAGE CONTAINER ===== */}
                  <MessageObserver
                    message={msg}
                    markAsRead={markMessageAsRead}
                    markAsDelivered={markMessageAsDelivered}
                    userEmail={currentUserEmail}
                    key={msg.id}
                    chatId={chatId}
                  >
                    <MessageContainer
                      className={
                        isCurrentUser(msg) ? "current-user" : "other-user"
                      }
                    >
                      {/* Message content - either URL preview or regular message */}
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
                          chatId={chatId}
                          onReply={handleReply}
                        />
                      )}

                      {/* ===== EMOJI REACTION BUTTON ===== */}
                      <IconButton
                        size="small"
                        className="emoji-hover-button"
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

                      {/* ===== QUICK EMOJI PICKER DROPDOWN ===== */}
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
                  </MessageObserver>
                  {/* ===== MESSAGE REACTIONS DISPLAY ===== */}
                  {msg.reactions &&
                    Object.entries(msg.reactions).length > 0 && (
                      <ReactionsContainer isCurrentUser={isCurrentUser(msg)}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                          <Chip
                            key={emoji}
                            title={users.join(", ")} // Tooltip showing who reacted
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
                      </ReactionsContainer>
                    )}

                  {/* ===== REPLY MESSAGES ===== */}

                  {replies.map((reply) => {
                    const originalMessage = messages.find(
                      (m) => m.id === reply.replyTo
                    );
                    const isOriginalSender = originalMessage
                      ? isCurrentUser(originalMessage)
                      : false;

                    return (
                      <MessageObserver
                        message={reply}
                        markAsRead={markMessageAsRead}
                        markAsDelivered={markMessageAsDelivered}
                        userEmail={currentUserEmail}
                        key={reply.id}
                        chatId={chatId}
                      >
                        <ReplyMessage
                          message={reply}
                          renderBody={renderMessageBody}
                          isOriginalSender={isOriginalSender}
                        />
                      </MessageObserver>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </LabelContainer>
        ))}
      </MessageList>

      {/* ===== REPLY PREVIEW BANNER ===== */}
      {replyMessage && (
        <ReplyPreview
          message={replyMessage}
          onCancel={() => setReplyMessage(null)}
          chatId={chatId}
        />
      )}

      {/* ===== MESSAGE INPUT AREA ===== */}
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

      {/* ===== FULL EMOJI PICKER OVERLAY ===== */}
      {showEmojiPicker && (
        <EmojiPickerContainer ref={emojiPickerRef}>
          <Picker data={data} onEmojiSelect={handleEmojiSelect} />
        </EmojiPickerContainer>
      )}
    </Container>
  );
}

// ========================================
// UTILITY FUNCTIONS (OUTSIDE COMPONENT)
// ========================================

/**
 * Validate if a string is a valid URL
 * Uses regex to check for various URL formats including HTTP/HTTPS, localhost, and IP addresses
 */
const isValidUrl = (string: string): boolean => {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z0-9\\-]+\\.)+[a-z]{2,})|" + // domain name
      "localhost|" + // localhost
      "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|" + // IP address
      "\\[?[a-f0-9:\\.]+\\])" + // IPv6
      "(\\:\\d+)?(\\/[-a-z0-9%_.~+]*)*" + // port and path
      "(\\?[;&a-z0-9%_.~+=-]*)?" + // query string
      "(\\#[-a-z0-9_]*)?$", // fragment locator
    "i"
  );
  return !!pattern.test(string);
};

export default ChatScreen;

// ========================================
// STYLED COMPONENTS
// ========================================

/**
 * Main container for the entire chat interface
 * Uses flexbox for proper layout structure
 */
const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",

  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.background.default
      : theme.palette.grey[100],
}));

/**
 * Scrollable container for the message list
 * Includes custom scrollbar styling for better UX
 */
const MessageList = styled(Box)(({ theme }) => ({
  flex: 1,
  height: "100%",
  overflowY: "auto",
  padding: "20px 30px",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.background.paper
      : theme.palette.grey[200],
  // Hide scrollbar for cleaner look
  "&::-webkit-scrollbar": {
    display: "none",
  },
  scrollbarWidth: "none",
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(1),
  marginTop: theme.spacing(1),
  maxWidth: "90%",
  [theme.breakpoints.up("lg")]: {
    maxWidth: "70%",
  },
  position: "relative",

  // Emoji button hover effects
  "& .emoji-hover-button": {
    opacity: 0,
    visibility: "hidden",
    transition: "opacity 0.2s ease, visibility 0.2s ease",
  },

  "&:hover .emoji-hover-button": {
    opacity: 1,
    visibility: "visible",
  },

  // Positioning for current user messages (right-aligned)
  "&.current-user": {
    alignSelf: "flex-end",

    "& .emoji-hover-button": {
      position: "absolute",
      top: "50%",
      left: "-35px",
      transform: "translateY(-50%)",
      zIndex: 1,
    },
  },

  // Positioning for other user messages (left-aligned)
  "&.other-user": {
    alignSelf: "flex-start",

    "& .emoji-hover-button": {
      position: "absolute",
      top: "50%",
      right: "-35px",
      transform: "translateY(-50%)",
      zIndex: 1,
    },
  },
}));

/**
 * Container for the message input area
 * Fixed at bottom of chat interface
 */
const InputContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(2),
  background: theme.palette.background.paper,
}));

/**
 * Positioned container for the emoji picker overlay
 * Appears above the input area when activated
 */
const EmojiPickerContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: "60px",
  marginLeft: theme.spacing(2),
  zIndex: 1000,
}));

/**
 * Container for date label chips
 * Centers the date separators in the message flow
 */
const LabelContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  margin: "10px 0",
}));

/**
 * Container for header action icons
 * Positioned on the right side of the chat header
 */
const IconContainer = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  marginLeft: "auto",
}));

/**
 * Styled date separator chip
 * Provides visual separation between message groups
 */
const StyledChip = styled(Chip)(({ theme }) => ({
  margin: "10px 0",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[700]
      : theme.palette.grey[600],
  color: theme.palette.common.white,
  fontWeight: 500,
}));

/**
 * Container for the quick emoji picker dropdown
 * Positioned relative to the message based on sender
 */
const QuickEmojiPickerContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isCurrentUser",
})<{ isCurrentUser?: boolean }>(({ theme, isCurrentUser }) => ({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 1000,
  right: isCurrentUser ? "200px" : "none",
  left: isCurrentUser ? "none" : "0px",
}));

/**
 * Container for message reaction chips
 * Aligned based on message sender and supports wrapping
 */
const ReactionsContainer = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "isCurrentUser",
})<{ isCurrentUser?: boolean }>(({ theme, isCurrentUser }) => ({
  alignSelf: isCurrentUser ? "flex-end" : "flex-start",
  fontSize: "0.8rem",
  padding: theme.spacing(0.5),
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(0.5),
  flexFlow: "wrap",
  transform: "translateY(-14px)", // Slight overlap with message
  [theme.breakpoints.up("lg")]: {
    maxWidth: "70%",
  },
}));
