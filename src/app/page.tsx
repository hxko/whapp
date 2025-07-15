"use client";

import Sidebar from "@components/Sidebar";
import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material"; // Import MUI components for consistent styling

/**
 * Home component for the Chat App.
 * Displays the sidebar and a welcome message.
 */
function Home() {
  return (
    <HomeContainer>
      <SidebarContainer>
        <Sidebar />
      </SidebarContainer>
      <MainContent>
        <WelcomeMessage>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to ChatLink
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a chat from the sidebar to start messaging
          </Typography>
        </WelcomeMessage>
      </MainContent>
    </HomeContainer>
  );
}

// Styled components for layout and styling
const HomeContainer = styled(Box)(() => ({
  display: "flex",
  height: "100vh", // Full viewport height
}));

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 300, // Default width for larger screens
  borderRight: `1px solid ${theme.palette.divider}`, // Use theme divider color

  // Responsive styles
  [theme.breakpoints.down("sm")]: {
    width: "100%", // Set width to 100% on small screens
    borderRight: "none", // Remove border on small screens
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  // Hide MainContent on small screens
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

const WelcomeMessage = styled(Box)(({ theme }) => ({
  textAlign: "center",
  color: theme.palette.text.secondary, // Use theme color for text
  padding: theme.spacing(2), // Add padding for better spacing
}));

export default Home;
