import React, { useState, useEffect } from "react"; // React and hooks for state and effects
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Link,
  CircularProgress,
  Menu,
  MenuItem,
} from "@mui/material"; // MUI components for UI elements
import { styled } from "@mui/material/styles"; // MUI styling utility
import MessageTimestamp from "./MessageTimestamp"; // Component to display message timestamp
import { Timestamp } from "firebase/firestore"; // Firestore Timestamp type
import OpenInNewIcon from "@mui/icons-material/OpenInNew"; // Icon for external links
import DropdownIcon from "@components/DropdownIcon"; // Import the DropdownIcon component
import { deleteMessage } from "@/utils/utils"; // Import the deleteMessage function

// Define the structure of the preview data
interface PreviewData {
  title: string; // Title of the preview
  description: string; // Description of the preview
  images: string[]; // Array of image URLs
  url: string; // The original URL
  siteName?: string; // Optional site name
  mediaType?: string; // Optional media type
}

// Define the props for the UrlPreviewComponent
interface UrlPreviewComponentProps {
  url: string;
  timestamp: Timestamp;
  chatId: string;
  messageId: string;
  onReply?: (message: any) => void; // Keep onReply to accept the constructed message
}

const UrlPreviewComponent: React.FC<UrlPreviewComponentProps> = ({
  url,
  timestamp,
  chatId,
  messageId,
  onReply,
}) => {
  // State variables for managing preview data and loading/error states
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true); // Indicates if data is being fetched
  const [error, setError] = useState<string | null>(null); // Captures any fetch errors
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // State for dropdown anchor

  // Fetch the URL preview data when the URL changes
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true); // Set loading state to true while fetching
        setError(null); // Reset error state

        // Fetch preview data from the API
        const response = await fetch(
          `/api/proxy?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch preview"); // Handle non-200 responses
        }

        const data: PreviewData = await response.json();
        setPreviewData(data); // Store the fetched preview data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error"); // Set error message
      } finally {
        setLoading(false); // Reset loading state after fetching
      }
    };

    if (url) {
      fetchPreview(); // Fetch preview if URL is provided
    }
  }, [url]); // Dependency array ensures effect runs when URL changes

  // Loading state: show a spinner while fetching data
  if (loading) {
    return (
      <StyledCard>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress /> {/* Visual feedback for loading */}
          </Box>
        </CardContent>
      </StyledCard>
    );
  }

  // Error state: show an error message if fetching fails
  if (error || !previewData) {
    return (
      <StyledCard>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Unable to load preview {/* Inform user of the error */}
          </Typography>
          <Link href={url} target="_blank" rel="noopener noreferrer">
            {url} {/* Provide the original URL as a fallback */}
          </Link>
        </CardContent>
      </StyledCard>
    );
  }

  // Handle card click to open the URL in a new tab
  const handleCardClick = () => {
    if (!anchorEl) {
      // Only open the URL if the dropdown is not open
      window.open(url, "_blank", "noopener,noreferrer"); // Open URL safely
    }
  };

  // Handle dropdown menu open
  const handleDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent click from propagating to the parent
    setAnchorEl(event.currentTarget); // Set the anchor element for the dropdown
  };

  // Handle dropdown menu close
  const handleClose = () => {
    setAnchorEl(null); // Reset the anchor element
  };

  // Handle reply action
  const handleReply = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent click from propagating to the parent container
    if (onReply) {
      // Construct a message-like object from the available props
      const messageForReply = {
        id: messageId,
        text: url,
        timestamp: timestamp,
        // Add any other properties your handleReply function expects
      };
      onReply(messageForReply);
    }
    handleClose(); // Close the menu
  };

  // Handle delete action
  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent click from propagating to the parent container
    try {
      await deleteMessage(chatId, messageId);
      handleClose();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <StyledCard onClick={handleCardClick}>
      {/* Display the image if available */}
      {previewData.images && previewData.images.length > 0 && (
        <StyledCardMedia
          image={`/api/image-proxy?url=${encodeURIComponent(
            previewData.images[0]
          )}`} // Use image-proxy/route.ts //  Use the first image for the preview
          title={previewData.title}
          onError={(e: React.SyntheticEvent<HTMLDivElement, Event>) => {
            e.currentTarget.style.display = "none"; // Hide image on error
          }}
        />
      )}
      <CardContent sx={{ position: "relative", paddingBottom: "30px" }}>
        <Box>
          <Typography variant="h6" component="h3" noWrap>
            {previewData.title} {/* Display the title of the preview */}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2, // Limit description to 2 lines
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 1,
            }}
          >
            {previewData.description} {/* Display the description */}
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {previewData.siteName || new URL(url).hostname}{" "}
                {/* Show site name or hostname */}
              </Typography>
              <OpenInNewIcon fontSize="small" sx={{ ml: 0.5 }} />{" "}
              {/* Icon for external link */}
            </Box>
            <DropdownIcon onClick={handleDropdownOpen} />{" "}
            {/* Use the DropdownIcon component */}
          </Box>
        </Box>
        <TimestampContainer>
          <MessageTimestamp timestamp={timestamp} />{" "}
          {/* Display the message timestamp */}
        </TimestampContainer>
      </CardContent>

      {/* Dropdown menu for delete and reply options */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleReply}>Reply</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </StyledCard>
  );
};

// Styled components for layout and styling
const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 400, // Set a maximum width for the card
  cursor: "pointer", // Change cursor to pointer on hover
  transition: "all 0.2s ease-in-out", // Smooth transition for hover effects
  border: `1px solid ${theme.palette.divider}`, // Use theme divider color for border
  "&:hover": {
    boxShadow: theme.shadows[4], // Elevate card on hover
    transform: "translateY(-2px)", // Slightly lift the card
    "& .MuiButtonBase-root": {
      opacity: 1, // Show the dropdown icon on hover
    },
  },
}));

const StyledCardMedia = styled(CardMedia)({
  height: 120, // Fixed height for the media
  objectFit: "cover", // Maintain aspect ratio of the image
});

// Styled component for the timestamp container
const TimestampContainer = styled(Box)(({ theme }) => ({
  position: "absolute", // Position absolute for timestamp
  bottom: 8, // Position from the bottom
  right: 8, // Position from the right
  fontSize: "12px", // Font size for the timestamp
  color: theme.palette.text.secondary, // Color based on theme
}));

export default UrlPreviewComponent;
