// src/app/page.tsx (replace your current home)
"use client";

import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Sidebar from "@components/Sidebar";
import ChatScreen from "@/components/ChatScreen";
import { styled } from "@mui/material/styles";
import { Box, Typography, Drawer, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Unified Chat App Layout
 * Handles both home state and chat state with responsive design
 */
function ChatApp() {
  const searchParams = useSearchParams();
  const chatId = searchParams?.get("chatId"); // Get chatId from URL params
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleChatSelect = () => {
    // Close mobile drawer when a chat is selected
    setMobileDrawerOpen(false);
  };

  return (
    <AppContainer>
      {/* Mobile Menu Button - only visible on small screens when in chat */}
      {chatId && (
        <MobileMenuButton onClick={handleDrawerToggle}>
          <MenuIcon />
        </MobileMenuButton>
      )}

      {/* Desktop Sidebar - always visible on large screens */}
      <DesktopSidebarContainer showOnMobile={!chatId}>
        <Sidebar onChatSelect={handleChatSelect} />
      </DesktopSidebarContainer>

      {/* Mobile Drawer - only on small screens */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileDrawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: "85%",
            maxWidth: 400,
          },
        }}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        </DrawerHeader>
        <Sidebar onChatSelect={handleChatSelect} />
      </Drawer>

      {/* Main Content Area */}
      <MainContent>
        {chatId ? (
          <ChatScreen />
        ) : (
          <WelcomeMessage>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome to ChatLink
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select a chat from the sidebar to start messaging
            </Typography>
          </WelcomeMessage>
        )}
      </MainContent>
    </AppContainer>
  );
}

export default ChatApp;

// Styled Components
const AppContainer = styled(Box)(() => ({
  display: "flex",
  height: "100vh",
  position: "relative",
}));

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  position: "fixed",
  top: 16,
  left: 16,
  zIndex: theme.zIndex.appBar,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  display: "none", // Hidden by default

  [theme.breakpoints.down("md")]: {
    display: "flex", // Show on mobile
  },
}));

const DesktopSidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "showOnMobile",
})<{ showOnMobile?: boolean }>(({ theme, showOnMobile }) => ({
  width: 400,
  borderRight: `1px solid ${theme.palette.divider}`,
  display: "block",

  [theme.breakpoints.down("md")]: {
    width: "100%",
    borderRight: "none",
    display: showOnMobile ? "block" : "none",
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",

  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginLeft: "70px",
  },
}));

const WelcomeMessage = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  textAlign: "center",
  color: theme.palette.text.secondary,
  padding: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    display: "none", // Hide welcome on mobile when no chat selected
  },
}));
