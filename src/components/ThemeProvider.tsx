"use client";

import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  PaletteMode,
} from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { useMemo, useEffect } from "react";
import { useThemeContext } from "./ThemeContext";

/**
 * Generates light/dark theme config based on mode.
 */
const getDesignTokens = (mode: PaletteMode) => {
  // Base primary color (same in both modes for branding consistency)
  const primaryMain = "#81C8B8";
  const secondaryMain = "#A3E0DB";

  return {
    palette: {
      mode,
      primary: {
        main: primaryMain,
      },
      secondary: {
        main: secondaryMain,
      },
      success: {
        main: primaryMain, // Match primary for visual coherence
      },
      error: {
        main: mode === "light" ? "#E57373" : "#F48FB1", // Softer red for dark mode
      },
      background: {
        default: mode === "light" ? "#FFFFFF" : "#1E2428",
        paper: mode === "light" ? "#E0E0E0" : "#2A2D30",
      },
    },
    typography: {
      fontFamily: "Roboto, sans-serif",
      body1: {
        fontSize: "0.95rem",
      },
    },
    shape: {
      borderRadius: 12,
    },
  };
};

const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { mode } = useThemeContext();

  // Create theme from current mode
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  /**
   * Dynamically update <meta name="theme-color" /> based on theme background
   * This affects browser UI on mobile (address bar etc.)
   */
  useEffect(() => {
    const metaTag = document.querySelector("meta[name='theme-color']");
    const color = theme.palette.background.default;

    if (metaTag) {
      metaTag.setAttribute("content", color);
    } else {
      const newTag = document.createElement("meta");
      newTag.setAttribute("name", "theme-color");
      newTag.setAttribute("content", color);
      document.head.appendChild(newTag);
    }
  }, [theme.palette.background.default]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default CustomThemeProvider;
