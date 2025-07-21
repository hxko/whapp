// DropdownIcon.tsx
import React from "react";
import { styled } from "@mui/material/styles";
import { IconButton } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"; // Import the icon

const DropdownIcon: React.FC<{
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}> = ({ onClick }) => {
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent click from propagating to the parent
    onClick(event); // Call the onClick handler passed as a prop
  };
  return (
    <StyledIconButton onClick={handleClick}>
      <KeyboardArrowDownRoundedIcon fontSize="small" />
    </StyledIconButton>
  );
};

// Styled component for the dropdown icon
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  right: 2, // Adjust position as needed
  top: 2, // Adjust position as needed for smaller size
  opacity: 0, // Start hidden
  transition: "opacity 0.2s ease-in-out", // Smooth transition for visibility
}));

export default DropdownIcon;
