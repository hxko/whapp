// Updated ChatScreen.tsx
import React, { useEffect, useState } from "react";
import { sendMessage, fetchMessages } from "@utils/utils";
import { useParams } from "next/navigation";
import { styled } from "@mui/material/styles";
import { TextField, Button, InputAdornment } from "@mui/material";
import { Messagetype } from "types/types";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { useAuth } from "@/components/AuthProvider";
import { useChatPartner } from "@/hooks/useChatPartner";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import ChatItem from "./ChatItem";

export type Params = {
  chatId?: string;
};

function ChatScreen() {
  const { user } = useAuth();
  const { chatId } = useParams<Params>();
  const [messages, setMessages] = useState<Messagetype[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Use the single hook with chatId
  const {
    chatPartner,
    loading: partnerLoading,
    error: partnerError,
  } = useChatPartner(chatId);

  useEffect(() => {
    if (chatId) {
      const unsubscribe = fetchMessages(chatId, setMessages);
      return () => unsubscribe();
    } else {
      console.error("Chat ID is undefined");
    }
  }, [chatId]);

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
    setShowEmojiPicker(false);
  };

  if (partnerLoading) {
    return <div>Loading chat partner...</div>;
  }

  if (partnerError) {
    return <div>Error loading chat partner: {partnerError}</div>;
  }

  return (
    <Container>
      <Header>{chatId && chatPartner && <ChatItem chatId={chatId} />}</Header>
      <MessageList>
        {messages.map((msg) => (
          <Message key={msg.id} isCurrentUser={msg.sender === user?.email}>
            <MessageText isCurrentUser={msg.sender === user?.email}>
              {msg.text}
            </MessageText>
          </Message>
        ))}
      </MessageList>
      <InputContainer>
        <TextField
          style={{ marginRight: 10 }}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          fullWidth
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmojiEmotionsIcon
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                />
              </InputAdornment>
            ),
          }}
        />
        <Button onClick={handleSendMessage} variant="contained">
          Send
        </Button>
      </InputContainer>

      {showEmojiPicker && (
        <EmojiPickerContainer>
          <Picker data={data} onEmojiSelect={handleEmojiSelect} />
        </EmojiPickerContainer>
      )}
    </Container>
  );
}

export default ChatScreen;

// Styled components for layout and styling
const Header = styled("div")`
  display: flex;
  height: 80px;
  align-items: center; // Center items vertically
  padding: 15px; // Add padding around the header
  border-bottom: 1px solid #e0e0e0; // Bottom border for separation
  background: white;
`;

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f5f5; // Light background for the header
`;

const MessageList = styled("div")`
  flex: 1;
  overflow-y: auto; // Allow vertical scrolling for the message list
  :-webkit-scrollbar {
    display: none; /* For Chrome, Safari, and Opera */
  }
  scrollbar-width: none; /* For Firefox */
  padding: 20px;
`;

const Message = styled("div")<{ isCurrentUser: boolean }>`
  display: flex;
  justify-content: ${(props) =>
    props.isCurrentUser
      ? "flex-end"
      : "flex-start"}; // Align messages based on sender
  margin: 10px 0; // Add margin between messages
`;

const MessageText = styled("div")<{ isCurrentUser: boolean }>`
  max-width: 70%; // Limit the width of the message bubble
  padding: 10px; // Add padding inside the message bubble
  border-radius: 10px; // Round the corners of the message bubble
  background-color: ${(props) =>
    props.isCurrentUser
      ? "#dcf8c6"
      : "#ffffff"}; // Change background color based on sender
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); // Add a subtle shadow for depth
`;

const InputContainer = styled("div")`
  display: flex;
  padding: 10px; // Add padding around the input area
  background: white;
`;

const EmojiPickerContainer = styled("div")`
  position: absolute; // Position it absolutely to avoid layout shifts
  bottom: 60px; // Adjust based on your layout
  left: 10px; // Adjust based on your layout
  z-index: 1000; // Ensure it appears above other elements
`;
