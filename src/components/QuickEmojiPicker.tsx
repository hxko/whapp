// components/QuickEmojiPicker.tsx
import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

type QuickEmojiPickerProps = {
  onSelect: (emoji: { native: string }) => void;
  onClose?: () => void;
  anchor?: "left" | "right";
};

const QuickEmojiPicker: React.FC<QuickEmojiPickerProps> = ({
  onSelect,
  onClose,
  anchor = "left",
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "absolute",
        zIndex: 1000,
        top: 30,
        [anchor]: 0,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: any) => {
          onSelect(emoji);
          onClose?.(); // Close picker after selection
        }}
        theme={theme.palette.mode}
        previewPosition="none"
        navPosition="none"
        searchPosition="none"
        maxFrequentRows={1}
        perLine={6}
        emojiSize={20}
        emojiButtonSize={28}
      />
    </Box>
  );
};

export default QuickEmojiPicker;
