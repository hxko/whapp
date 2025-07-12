"use client"; // Indicate that this component is a client component

import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  PaletteMode,
} from "@mui/material/styles"; // Import MUI theme provider and utilities
import { CssBaseline } from "@mui/material"; // Import CssBaseline for consistent styling
import { useMemo } from "react"; // Import useMemo for performance optimization
import { useThemeContext } from "./ThemeContext"; // Import custom theme context

// Function to get design tokens based on the current mode
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          primary: {
            main: "#81C8B8", // Light mode primary color
            contrastText: "#000000", // Light mode primary text color
          },
          secondary: {
            main: "#A3E0DB", // Light mode secondary color
            contrastText: "#000000", // Light mode secondary text color
          },
          background: {
            default: "#FFFFFF", // Light mode background color
            paper: "#E0E0E0", // Light mode paper color
          },
        }
      : {
          primary: {
            main: "#81C8B8", // Dark mode primary color
            contrastText: "#000000", // Dark mode primary text color
          },
          secondary: {
            main: "#A3E0DB", // Dark mode secondary color
            contrastText: "#000000", // Dark mode secondary text color
          },
          background: {
            default: "#1E2428", // Dark mode background color
            paper: "#2A2D30", // Dark mode paper color
          },
        }),
  },
  typography: {
    fontFamily: "Roboto, sans-serif", // Set the font family
    body1: {
      fontSize: "0.95rem", // Set the body font size
    },
  },
  shape: {
    borderRadius: 12, // Set border radius for components
  },
});

// Custom theme provider component
const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { mode } = useThemeContext(); // Get the current theme mode from context

  // Create a memoized theme object based on the current mode
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      {" "}
      {/* Provide the theme to MUI components */}
      <CssBaseline /> {/* Normalize styles across browsers */}
      {children} {/* Render child components */}
    </MuiThemeProvider>
  );
};

export default CustomThemeProvider; // Export the custom theme provider
