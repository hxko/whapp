import React from "react";
import { styled } from "@mui/material/styles";
import { Messagetype } from "@/types/types";
import { useAuth } from "@/components/AuthProvider";
import MessageTimestamp from "./MessageTimestamp";
import { Box, Typography } from "@mui/material";
import { shouldForwardProp } from "@mui/system";

const Message = ({ message }: { message: Messagetype }) => {
  const { user } = useAuth();
  const isSender = message.sender === user?.email;
  const Container = isSender ? Sender : Recipient;

  return (
    <Container>
      <MessageText isSender={isSender}>
        <Typography variant="body1">{message.text}</Typography>
        <MessageTimestamp timestamp={message.timestamp} />
      </MessageText>
    </Container>
  );
};

export default Message;
const Sender = styled(Box)`
  align-self: flex-end;
  max-width: 70%;
  margin: 10px 0;
`;

const Recipient = styled(Box)`
  align-self: flex-start;
  max-width: 70%;
  margin: 10px 0;
`;

const MessageText = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isSender",
})<{ isSender: boolean }>(({ theme, isSender }) => ({
  display: "flex", // Use flexbox for layout
  flexDirection: "column", // Stack items vertically
  justifyContent: "space-between", // Space between text and timestamp
  padding: "10px",
  borderRadius: "10px",
  backgroundColor: isSender
    ? theme.palette.mode === "dark"
      ? theme.palette.primary.dark // Use secondary dark color for sender in dark mode
      : theme.palette.primary.light // Use secondary light color for sender in light mode
    : theme.palette.mode === "dark"
    ? theme.palette.grey[800] // Dark gray for recipient in dark mode
    : theme.palette.common.white, // White for recipient in light mode
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
  position: "relative", // Position relative for absolute positioning of timestamp
  wordWrap: "break-word", // Allow long words to break and wrap onto the next line
  overflowWrap: "break-word", // Ensure that long words break correctly
  whiteSpace: "pre-wrap", // Preserve whitespace and wrap text
}));

const TimestampContainer = styled(Typography)`
  font-size: 12px;
  color: ${({ theme }) =>
    theme.palette.text.secondary}; // Use MUI palette for timestamp color
  align-self: flex-end; // Align timestamp to the bottom right
  margin-top: 5px; // Add some space above the timestamp
`;
