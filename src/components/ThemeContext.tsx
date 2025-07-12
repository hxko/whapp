"use client"; // Indicate that this component is a client component

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PaletteMode } from "@mui/material"; // Import PaletteMode type from MUI

// Define the shape of the theme context
interface ThemeContextType {
  mode: PaletteMode; // Current theme mode (light or dark)
  toggleMode: () => void; // Function to toggle the theme mode
}

// Create the ThemeContext with an initial value of undefined
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeContextProvider component to provide theme context to children
export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<PaletteMode>("light"); // Initialize mode state

  // Effect to set initial mode based on user preference
  useEffect(() => {
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setMode(prefersDarkMode ? "dark" : "light"); // Set initial mode

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setMode(event.matches ? "dark" : "light"); // Update mode on preference change
    };

    mediaQuery.addEventListener("change", handleChange); // Listen for changes
    return () => {
      mediaQuery.removeEventListener("change", handleChange); // Cleanup listener
    };
  }, []);

  // Function to toggle between light and dark mode
  const toggleMode = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ mode, toggleMode }), [mode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider> // Provide context value to children
  );
};

// Custom hook to use the theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      "useThemeContext must be used within a ThemeContextProvider"
    ); // Error if used outside provider
  }
  return context; // Return the context value
};
