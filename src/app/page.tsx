// src/app/page.tsx
"use client";
import Sidebar from "@components/Sidebar";
import { styled } from "@mui/material/styles";

export default function Home() {
  return (
    <HomeContainer>
      <SidebarContainer>
        <Sidebar />
      </SidebarContainer>
      <MainContent>
        <WelcomeMessage>
          <h1>Welcome to Chat App</h1>
          <p>Select a chat from the sidebar to start messaging</p>
        </WelcomeMessage>
      </MainContent>
    </HomeContainer>
  );
}

const HomeContainer = styled("div")`
  display: flex;
  height: 100vh;
`;

const SidebarContainer = styled("div")`
  width: 300px; // Default width for larger screens
  border-right: 1px solid #e0e0e0;

  @media (max-width: 600px) {
    width: 100%; // Set width to 100% on small screens
    border-right: none; // Remove border on small screens
  }
`;

const MainContent = styled("div")`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 600px) {
    display: none; // Hide MainContent on small screens
  }
`;

const WelcomeMessage = styled("div")`
  text-align: center;
  color: #666;
`;
