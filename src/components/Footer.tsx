// Footer.tsx
import React from "react";
import { Box } from "@mui/material";
import ThemeToggleButton from "./ThemeToggleButton"; // Import the toggle button
import { useThemeContext } from "@components/ThemeContext"; // Import the theme context

const Footer: React.FC = () => {
  const { mode, toggleMode } = useThemeContext(); // Get the mode and toggle function from context

  return (
    <Box
      component="footer"
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: 2,
        backgroundColor:
          mode === "light" ? "background.paper" : "background.default", // Use theme palette colors
        color: mode === "light" ? "text.primary" : "text.secondary", // Use theme text colors
        position: "relative",
        bottom: 0,
        width: "100%",
        height: "90px",
      }}
    >
      <ThemeToggleButton mode={mode} onToggle={toggleMode} />
    </Box>
  );
};

export default Footer;
