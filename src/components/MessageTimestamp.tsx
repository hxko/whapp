import React from "react";
import { Timestamp } from "firebase/firestore"; // Import Timestamp from Firebase
import { styled } from "@mui/material/styles";

interface MessageTimestampProps {
  timestamp: Timestamp; // Specify the type for timestamp
}

const MessageTimestamp: React.FC<MessageTimestampProps> = ({ timestamp }) => {
  const date = timestamp.toDate(); // Convert Firebase Timestamp to JavaScript Date
  const hours = String(date.getHours()).padStart(2, "0"); // Pad hours
  const minutes = String(date.getMinutes()).padStart(2, "0"); // Pad minutes

  return (
    <TimestampContainer>
      {hours}:{minutes}
    </TimestampContainer>
  );
};

export default MessageTimestamp;

const TimestampContainer = styled("div")(({ theme }) => ({
  fontSize: "12px",
  color: theme.palette.text.secondary, // Use the theme's secondary text color
  alignSelf: "flex-end", // Align timestamp to the bottom right
  marginBottom: "-6px", // Add some space above the timestamp
}));
