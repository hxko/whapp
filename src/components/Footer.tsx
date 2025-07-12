// Footer.tsx
import React from "react"; // Import React
import { Box } from "@mui/material"; // Import MUI Box component
import ThemeToggleButton from "./ThemeToggleButton"; // Import the toggle button
import { useThemeContext } from "@components/ThemeContext"; // Import the theme context
import { styled } from "@mui/material/styles"; // Import MUI styled utility

const Footer: React.FC = () => {
  const { mode, toggleMode } = useThemeContext(); // Get the mode and toggle function from context

  return (
    <StyledFooter mode={mode}>
      <ThemeToggleButton mode={mode} onToggle={toggleMode} />
    </StyledFooter>
  );
};

// Styled component for the footer
const StyledFooter = styled(Box)<{ mode: string }>(({ theme, mode }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  padding: theme.spacing(2), // Use theme spacing for padding
  backgroundColor:
    mode === "light"
      ? theme.palette.background.paper
      : theme.palette.background.default, // Use theme palette colors
  color:
    mode === "light"
      ? theme.palette.text.primary
      : theme.palette.text.secondary, // Use theme text colors
  position: "relative",
  bottom: 0,
  width: "100%",
  height: "90px",
}));

export default Footer;
