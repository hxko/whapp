// theme/CustomThemeProvider.tsx (oder wie auch immer deine Datei heißt)

"use client";

import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  PaletteMode,
} from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { useMemo } from "react";
import { useThemeContext } from "./ThemeContext"; // Passen Sie den Pfad an

const getDesignTokens = (mode: PaletteMode) => {
  // Definiere deine Primärfarbe einmal, um sie wiederverwenden zu können
  const primaryMainLight = "#81C8B8";
  const primaryMainDark = "#81C8B8"; // Du kannst auch eine leicht abgeänderte Farbe für Dark Mode wählen, falls gewünscht

  return {
    palette: {
      mode,
      ...(mode === "light"
        ? {
            // --- Light Mode Farben ---
            primary: {
              main: primaryMainLight,
              // contrastText: "#000000",
            },
            secondary: {
              main: "#A3E0DB",
              // contrastText: "#000000",
            },
            // --- Überschreiben der Standardfarben ---
            // Success soll gleich primary sein
            success: {
              main: primaryMainLight, // Verwende die gleiche Farbe wie primary.main
              // contrastText wird automatisch berechnet, kann aber bei Bedarf überschrieben werden
              // z.B. contrastText: '#000000'
            },
            // Error soll besser zu primary passen
            // Option 1: Ein kräftigeres, aber komplementäres Rot (Beispiel)
            error: {
              main: "#E57373", // Ein weicheres, weniger grelles Rot, das zu Türkis passt
              // Alternativen könnten sein:
              // main: "#F44336", // Standard MUI Rot (etwas grell)
              // main: "#D32F2F", // Dunkleres Rot
              // main: "#EF5350", // Leicht orangenes Rot
            },
            // Optional: Auch warning/info anpassen, falls nötig
            // warning: { main: '#...' },
            // info: { main: '#...' },
            background: {
              default: "#FFFFFF",
              paper: "#E0E0E0",
            },
          }
        : {
            // --- Dark Mode Farben ---
            primary: {
              main: primaryMainDark,
              // contrastText: "#000000",
            },
            secondary: {
              main: "#A3E0DB",
              // contrastText: "#000000",
            },
            // --- Überschreiben der Standardfarben für Dark Mode ---
            success: {
              main: primaryMainDark, // Gleiche Logik wie im Light Mode
              // contrastText: '#ffffff' // Falls nötig
            },
            // Wähle eine Error-Farbe, die im Dark Mode gut aussieht und zu primary passt
            error: {
              main: "#F48FB1", // Beispiel: Ein Rosa/Rot-Ton, der oft im Dark-Mode besser wirkt
              // Alternativen:
              // main: "#EF5350", // Leuchtendes Rot
              // main: "#E57373", // Weicheres Rot
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
  };
};

const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
