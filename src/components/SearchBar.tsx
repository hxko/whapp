import { styled } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import React from "react";

interface SearchBarProps {
  // Define any props if needed
  input: string;
  onSearch: (input: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ input, onSearch }) => {
  const handleChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  return (
    <SearchContainer>
      <SearchIcon />
      <SearchInput
        type="text"
        placeholder="Search in chats"
        value={input}
        onChange={handleChangeInput}
      />
    </SearchContainer>
  );
};

export default SearchBar;

const SearchContainer = styled("div")`
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 2px;
`;
const SearchInput = styled("input")`
  display: flex;
  flex: 1;
  outline: none;
  padding: 2px;
`;
