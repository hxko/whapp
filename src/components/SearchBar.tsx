import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import React from "react";
import { TextField, InputAdornment } from "@mui/material";

interface SearchBarProps {
  input: string;
  onSearch: (input: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ input, onSearch }) => {
  const handleChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  return (
    <TextField
      sx={{ margin: 2 }}
      variant="outlined"
      placeholder="Search in chats"
      value={input}
      onChange={handleChangeInput}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default SearchBar;
