// src/app/chat/[chatId]/page.tsx
"use client";
import React from "react";
import { useParams } from "next/navigation"; // Use useParams from next/navigation
import Sidebar from "@components/Sidebar"; // Import the Sidebar component
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography"; // Import MUI Typography
import ChatScreen from "@/components/ChatScreen";

const ChatView: React.FC = () => {
  const { chatId } = useParams(); // Get the chatId from the URL

  return (
    <Container>
      <Sidebar />
      <ChatContainer>
        <ChatScreen></ChatScreen>
      </ChatContainer>
    </Container>
  );
};

export default ChatView;

const ChatContainer = styled("div")`
  flex: 1;
  overflow: scroll;
  height: 100vh;

  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const Container = styled("div")`
  display: flex;
`;
