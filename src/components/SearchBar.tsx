import { styled } from "@mui/material/styles"; // Import styled from MUI
import SearchIcon from "@mui/icons-material/Search"; // Import the Search icon
import React from "react";

// Define the props for the SearchBar component
interface SearchBarProps {
  input: string; // The current input value
  onSearch: (input: string) => void; // Callback function to handle search input changes
}

/**
 * SearchBar component for searching through chats.
 * Displays an input field with a search icon.
 */
const SearchBar: React.FC<SearchBarProps> = ({ input, onSearch }) => {
  // Handle input changes and call the onSearch callback
  const handleChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value); // Pass the new input value to the onSearch function
  };

  return (
    <SearchContainer>
      <SearchIcon /> {/* Display the search icon */}
      <SearchInput
        id="search-bar"
        type="text"
        placeholder="Search in chats" // Placeholder text for the input field
        value={input} // Controlled input value
        onChange={handleChangeInput} // Handle input changes
      />
    </SearchContainer>
  );
};

export default SearchBar;

// Styled components for consistent styling
const SearchContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1), // Use theme spacing for padding
  backgroundColor: theme.palette.background.paper, // Use theme color for background
  boxShadow: theme.shadows[1], // Use theme shadows for a subtle effect
}));

const SearchInput = styled("input")(({ theme }) => ({
  flex: 1, // Allow the input to grow and fill available space
  outline: "none", // Remove default outline
  padding: theme.spacing(1), // Use theme spacing for padding
  border: `1px solid ${theme.palette.divider}`, // Use theme color for border
  borderRadius: theme.shape.borderRadius, // Use theme shape for border radius
  "&:focus": {
    borderColor: theme.palette.primary.main, // Change border color on focus
  },
}));
