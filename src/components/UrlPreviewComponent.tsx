import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Link,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MessageTimestamp from "./MessageTimestamp"; // Import the MessageTimestamp component
import { Timestamp } from "firebase/firestore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew"; // Import the external link icon

interface PreviewData {
  title: string;
  description: string;
  images: string[];
  url: string;
  siteName?: string;
  mediaType?: string;
}

interface UrlPreviewComponentProps {
  url: string;
  timestamp: Timestamp; // Add timestamp prop
}

const UrlPreviewComponent: React.FC<UrlPreviewComponentProps> = ({
  url,
  timestamp,
}) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/proxy?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch preview");
        }

        const data: PreviewData = await response.json();
        setPreviewData(data);
      } catch (err) {
        console.error("Error fetching preview:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchPreview();
    }
  }, [url]);

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
            <CircularProgress />
          </Box>
        </CardContent>
      </StyledCard>
    );
  }

  if (error || !previewData) {
    return (
      <StyledCard>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Unable to load preview
          </Typography>
          <Link href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </Link>
        </CardContent>
      </StyledCard>
    );
  }

  const handleCardClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <StyledCard onClick={handleCardClick}>
      {previewData.images && previewData.images.length > 0 && (
        <StyledCardMedia
          image={previewData.images[0]}
          title={previewData.title}
          onError={(e: React.SyntheticEvent<HTMLDivElement, Event>) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      <CardContent sx={{ position: "relative", paddingBottom: "30px" }}>
        <Box>
          <Typography variant="h6" component="h3" noWrap>
            {previewData.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 1,
            }}
          >
            {previewData.description}
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {previewData.siteName || new URL(url).hostname}
              </Typography>
              <OpenInNewIcon fontSize="small" sx={{ ml: 0.5 }} />{" "}
              {/* External link icon */}
            </Box>
          </Box>
        </Box>
        <TimestampContainer>
          <MessageTimestamp timestamp={timestamp} />
        </TimestampContainer>
      </CardContent>
    </StyledCard>
  );
};

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  border: `1px solid ${theme.palette.divider}`,
  "&:hover": {
    boxShadow: theme.shadows[4],
    transform: "translateY(-2px)",
  },
}));

const StyledCardMedia = styled(CardMedia)({
  height: 120,
  objectFit: "cover",
});

// Styled component for the timestamp container
const TimestampContainer = styled(Box)(({ theme }) => ({
  position: "absolute", // Position absolute
  bottom: 8, // Position from the bottom
  right: 8, // Position from the right
  fontSize: "12px",
  color: theme.palette.text.secondary,
}));

export default UrlPreviewComponent;
