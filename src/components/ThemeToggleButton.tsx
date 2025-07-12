import { ToggleButton } from "@mui/material"; // Import ToggleButton from MUI
import Brightness7Icon from "@mui/icons-material/Brightness7"; // Import sun icon for light mode
import Brightness2Icon from "@mui/icons-material/Brightness2"; // Import moon icon for dark mode
import { PaletteMode } from "@mui/material"; // Import PaletteMode type for type safety

// Define the props for the ThemeToggleButton component
interface ThemeToggleButtonProps {
  mode: PaletteMode; // Current theme mode (light or dark)
  onToggle: () => void; // Function to toggle the theme
}

// ThemeToggleButton component to switch between light and dark modes
const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  mode,
  onToggle,
}) => {
  return (
    <ToggleButton
      value="theme" // Value for the toggle button
      selected={mode === "dark"} // Determine if the button is selected based on the current mode
      onChange={onToggle} // Call the onToggle function when the button is clicked
    >
      {mode === "light" ? (
        <Brightness2Icon /> // Show moon icon for light mode
      ) : (
        <Brightness7Icon /> // Show sun icon for dark mode
      )}
    </ToggleButton>
  );
};

export default ThemeToggleButton; // Export the component
