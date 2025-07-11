// ThemeToggleButton.tsx
import { ToggleButton } from "@mui/material";
import Brightness7Icon from "@mui/icons-material/Brightness7"; // Sun icon
import Brightness2Icon from "@mui/icons-material/Brightness2"; // Moon icon
import { PaletteMode } from "@mui/material";

interface ThemeToggleButtonProps {
  mode: PaletteMode;
  onToggle: () => void;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  mode,
  onToggle,
}) => {
  return (
    <ToggleButton value="theme" selected={mode === "dark"} onChange={onToggle}>
      {mode === "light" ? (
        <>
          <Brightness2Icon /> {/* Moon icon */}
        </>
      ) : (
        <>
          <Brightness7Icon /> {/* Sun icon */}
        </>
      )}
    </ToggleButton>
  );
};

export default ThemeToggleButton;
