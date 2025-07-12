// src/app/chat/[chatId]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation"; // Use useParams from next/navigation
import Sidebar from "@components/Sidebar"; // Import the Sidebar component
import { styled } from "@mui/material/styles"; // Import styled from MUI
import ChatScreen from "@/components/ChatScreen"; // Import the ChatScreen component

/**
 * ChatView component displays the chat interface for a specific chat.
 * It includes a sidebar and the chat screen.
 */
const ChatView: React.FC = () => {
  const { chatId } = useParams(); // Get the chatId from the URL

  return (
    <Container>
      <SidebarContainer>
        <Sidebar />
      </SidebarContainer>
      <ChatContainer>
        <ChatScreen />
      </ChatContainer>
    </Container>
  );
};

export default ChatView;

// Styled components for layout and styling
const Container = styled("div")(({ theme }) => ({
  display: "flex",
  height: "100vh", // Full viewport height

  // Responsive styles for small screens
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column", // Stack elements vertically on small screens
  },
}));

const SidebarContainer = styled("div")(({ theme }) => ({
  width: 300, // Default width for larger screens
  borderRight: `1px solid ${theme.palette.divider}`, // Use theme divider color

  // Hide sidebar on small screens
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

const ChatContainer = styled("div")(({ theme }) => ({
  flex: 1,
  overflow: "scroll", // Enable scrolling
  height: "100vh", // Full viewport height

  // Hide scrollbar for a cleaner look
  "::webkit-scrollbar": {
    display: "none",
  },
  msOverflowStyle: "none", // For Internet Explorer and Edge
  scrollbarWidth: "none", // For Firefox
}));
