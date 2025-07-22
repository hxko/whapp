import React, { useState } from "react"; // Import React and useState
import { styled } from "@mui/material/styles"; // Import styled utility from MUI
import { Messagetype } from "@/types/types"; // Import the message type definition
import { useAuth } from "@/components/AuthProvider"; // Import authentication context
import MessageTimestamp from "./MessageTimestamp"; // Import the timestamp component
import { Box, Typography, Menu, MenuItem, IconButton } from "@mui/material"; // Import MUI components
import { deleteMessage } from "@/utils/utils"; // Import the deleteMessage function
import DropdownIcon from "@components/DropdownIcon"; // Import DropdownIcon
import ReplyMessage from "./ReplyMessage"; // Import ReplyMessage

// Message component to display individual messages
const Message = ({
  message,
  chatId,
  onReply, // Add onReply prop
}: {
  message: Messagetype;
  chatId: string;
  onReply: (message: Messagetype) => void; // Function to handle reply
}) => {
  const { user } = useAuth(); // Get the current user from authentication context
  const isSender = message.sender === user?.email; // Determine if the current user is the sender
  const Container = isSender ? Sender : Recipient; // Choose the appropriate container based on sender status

  // State for dropdown menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // State for dropdown menu anchor

  // Handle opening the dropdown menu
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle closing the dropdown menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle delete action
  const handleDelete = async () => {
    await deleteMessage(chatId, message.id); // Call the deleteMessage function
    handleClose(); // Close the menu after deletion
  };

  // Handle reply action
  const handleReply = () => {
    onReply(message); // Call the onReply function passed as a prop
    handleClose(); // Close the menu after replying
  };

  return (
    <Container>
      <MessageText isSender={isSender}>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflowWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          <Typography variant="body1">{message.text}</Typography>
        </Box>
        <TimestampContainer className="timestamp">
          <MessageTimestamp timestamp={message.timestamp} />
        </TimestampContainer>
        {/* TODO: Conditionally render menu for Sender or Recipient. Dont show delete if Recipient Message. */}
        {/* TODO: Check if replies getting deleted when message gets deleted */}
        <DropdownIcon onClick={handleClick} />
      </MessageText>

      {/* Dropdown menu for delete and reply options */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleReply}>Reply</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </Container>
  );
};

export default Message;

// Styled component for messages sent by the user
const Sender = styled(Box)(({ theme }) => ({
  alignSelf: "flex-end",
  margin: "10px 0",
  position: "relative",
  width: "100%", // Default to full width
  [theme.breakpoints.up("lg")]: {
    maxWidth: "70%", // Apply 70% width on small screens and up
  },
  "&:hover .MuiIconButton-root": {
    opacity: 1, // Show icon on hover
  },
}));

// Styled component for messages received from others
const Recipient = styled(Box)(({ theme }) => ({
  alignSelf: "flex-start",
  margin: "10px 0",
  position: "relative",
  width: "100%",
  [theme.breakpoints.up("lg")]: {
    maxWidth: "70%",
  },
  "&:hover .MuiIconButton-root": {
    opacity: 1, // Show icon on hover
  },
}));

const MessageText = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isSender",
})<{ isSender: boolean }>(({ theme, isSender }) => ({
  display: "flex",
  alignItems: "flex-end", // Align timestamp and text bottom-aligned
  justifyContent: "space-between",
  gap: 6,
  padding: theme.spacing(1),
  borderRadius: "10px",
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
  "&:hover .timestamp": {
    opacity: 0, // Hide timestamp on hover
  },
}));

const TimestampContainer = styled(Box)({
  opacity: 1, // Default opacity
  transition: "opacity 0.2s ease-in-out", // Smooth transition for visibility
});
