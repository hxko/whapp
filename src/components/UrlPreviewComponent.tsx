import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Link,
  Skeleton,
} from "@mui/material";
import { styled } from "@mui/material/styles";

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
}

const UrlPreviewComponent: React.FC<UrlPreviewComponentProps> = ({ url }) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);

        // THIS IS WHERE THE FRONTEND CALLS YOUR BACKEND API
        // It sends the URL to your /api/proxy endpoint
        // Your backend then uses link-preview-js to extract the metadata
        const response = await fetch(
          `/api/proxy?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch preview");
        }

        // The response contains the metadata extracted by link-preview-js
        // (or the fallback HTML parser if link-preview-js failed)
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
        <Skeleton variant="rectangular" width="100%" height={120} />
        <CardContent>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
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
            // Hide image if it fails to load
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      <CardContent>
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
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {previewData.siteName || new URL(url).hostname}
          </Typography>
          <Typography variant="caption" color="primary">
            {getMediaTypeLabel(previewData.mediaType)}
          </Typography>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

const getMediaTypeLabel = (mediaType?: string): string => {
  switch (mediaType) {
    case "video":
      return "▶️ Video";
    case "image":
      return "🖼️ Image";
    case "audio":
      return "🎵 Audio";
    default:
      return "🔗 Link";
  }
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

export default UrlPreviewComponent;
