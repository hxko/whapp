import React from "react"; // Import React
import { styled } from "@mui/material/styles"; // Import styled utility from MUI
import { Messagetype } from "@/types/types"; // Import the message type definition
import { useAuth } from "@/components/AuthProvider"; // Import authentication context
import MessageTimestamp from "./MessageTimestamp"; // Import the timestamp component
import { Box, Typography } from "@mui/material"; // Import MUI components

// Message component to display individual messages
const Message = ({ message }: { message: Messagetype }) => {
  const { user } = useAuth(); // Get the current user from authentication context
  const isSender = message.sender === user?.email; // Determine if the current user is the sender
  const Container = isSender ? Sender : Recipient; // Choose the appropriate container based on sender status

  return (
    <Container>
      <MessageText isSender={isSender}>
        <Typography variant="body1">{message.text}</Typography>{" "}
        {/* Display the message text */}
        <MessageTimestamp timestamp={message.timestamp} />{" "}
        {/* Display the message timestamp */}
      </MessageText>
    </Container>
  );
};

export default Message;

// Styled component for messages sent by the user
const Sender = styled(Box)`
  align-self: flex-end; // Align sender messages to the right
  max-width: 70%; // Limit the maximum width of the message bubble
  margin: 10px 0; // Add vertical margin between messages
`;

// Styled component for messages received from others
const Recipient = styled(Box)`
  align-self: flex-start; // Align recipient messages to the left
  max-width: 70%; // Limit the maximum width of the message bubble
  margin: 10px 0; // Add vertical margin between messages
`;

// Styled component for the message text container
const MessageText = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isSender", // Prevent the isSender prop from being forwarded to the DOM
})<{ isSender: boolean }>(({ theme, isSender }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "10px",
  borderRadius: "10px",
  backgroundColor: isSender
    ? theme.palette.mode === "dark"
      ? theme.palette.primary.dark
      : theme.palette.primary.light
    : theme.palette.mode === "dark"
    ? theme.palette.grey[800]
    : theme.palette.common.white,
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
  position: "relative", // Position relative for absolute positioning of timestamp
  wordWrap: "break-word",
  overflowWrap: "break-word", // Ensure that long words break correctly
  whiteSpace: "pre-wrap", // Preserve whitespace and wrap text
}));
