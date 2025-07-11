// src/components/ThemeProvider.tsx
"use client";

import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  PaletteMode,
} from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { useMemo } from "react";
import { useThemeContext } from "./ThemeContext";

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          primary: {
            main: "#81C8B8",
            contrastText: "#000000",
          },
          secondary: {
            main: "#A3E0DB",
            contrastText: "#000000",
          },
          background: {
            default: "#FFFFFF",
            paper: "#E0E0E0",
          },
        }
      : {
          primary: {
            main: "#81C8B8",
            contrastText: "#000000",
          },
          secondary: {
            main: "#A3E0DB",
            contrastText: "#000000",
          },
          background: {
            default: "#1E2428",
            paper: "#2A2D30",
          },
        }),
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
});

const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { mode } = useThemeContext();

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default CustomThemeProvider;
