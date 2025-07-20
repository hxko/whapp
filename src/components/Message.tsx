import React from "react"; // Import React
import { styled } from "@mui/material/styles"; // Import styled utility from MUI
import { Messagetype } from "@/types/types"; // Import the message type definition
import { useAuth } from "@/components/AuthProvider"; // Import authentication context
import MessageTimestamp from "./MessageTimestamp"; // Import the timestamp component
import { Box, Typography, Menu, MenuItem, IconButton } from "@mui/material"; // Import MUI components
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"; // Import the icon
import { deleteMessage } from "@/utils/utils"; // Import the deleteMessage function

// Message component to display individual messages
const Message = ({
  message,
  chatId,
}: {
  message: Messagetype;
  chatId: string;
}) => {
  const { user } = useAuth(); // Get the current user from authentication context
  const isSender = message.sender === user?.email; // Determine if the current user is the sender
  const Container = isSender ? Sender : Recipient; // Choose the appropriate container based on sender status

  // State for dropdown menu
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null); // State for dropdown menu anchor

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
        <MessageTimestamp timestamp={message.timestamp} />
        {isSender && (
          <DropdownIcon
            size="small"
            onClick={handleClick}
            className="dropdown-icon"
          >
            <KeyboardArrowDownRoundedIcon fontSize="small" />
          </DropdownIcon>
        )}
      </MessageText>

      {/* Dropdown menu for delete option */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
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
  "&:hover .dropdown-icon": {
    display: "block",
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
  "&:hover .dropdown-icon": {
    display: "block",
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
}));

// Styled component for the dropdown icon
const DropdownIcon = styled(IconButton)(({ theme }) => ({
  display: "none", // Hide by default
  position: "absolute",
  right: 3, // Adjust position as needed
  top: 3, // Adjust position as needed for smaller size
  width: theme.spacing(2), // Set a fixed width for the button
  height: theme.spacing(2), // Set a fixed height for the button
  padding: 0, // Remove padding
  "&:hover": {
    backgroundColor: theme.palette.action.hover, // Change background on hover
    borderRadius: "50%", // Make it circular
  },
  "& .MuiSvgIcon-root": {
    fontSize: "1rem", // Set the icon size
  },
}));
