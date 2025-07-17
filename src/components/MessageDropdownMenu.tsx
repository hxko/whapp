import React from "react";
import { Menu, MenuItem } from "@mui/material";

interface DropdownMenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onDelete,
}) => {
  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLElement>,
    action: () => void
  ) => {
    event.stopPropagation(); // ✅ Prevent bubbling
    action(); // Run the action (e.g. delete)
    onClose(); // Close the menu
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={(e, reason) => {
        // optional: prevent bubbling from clickaway
        if (reason === "backdropClick") {
          (e as any)?.stopPropagation?.();
        }
        onClose();
      }}
      onClick={(e) => e.stopPropagation()} // ✅ Prevent all clicks from bubbling
      sx={{
        "& .MuiPaper-root": {
          width: "120px",
        },
      }}
    >
      <MenuItem onClick={(e) => handleMenuItemClick(e, onDelete)}>
        Delete
      </MenuItem>
      {/* Add more MenuItems if needed */}
    </Menu>
  );
};

export default DropdownMenu;
