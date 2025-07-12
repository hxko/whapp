// src/components/UrlPreviewComponent.tsx
import React, { useEffect, useState } from "react";
import {
  Typography,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Box,
  Skeleton,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";

interface PreviewData {
  title: string;
  description: string;
  images: string[];
  url: string;
}

interface UrlPreviewComponentProps {
  url: string;
}

const UrlPreviewComponent: React.FC<UrlPreviewComponentProps> = ({ url }) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!url) return;

      setLoading(true);
      setError(null);

      try {
        // IMPORTANT: Use your proxy route instead of direct fetch
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data: PreviewData = await response.json();
        setPreviewData(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        console.error("Error fetching URL preview:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  const handleClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ margin: "10px 0" }}>
        Failed to load preview: {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card sx={{ display: "flex", margin: "10px 0" }}>
        <Skeleton variant="rectangular" width={120} height={80} />
        <Box sx={{ flex: 1, padding: 2 }}>
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </Card>
    );
  }

  if (!previewData) {
    return null;
  }

  return (
    <Card
      sx={{
        display: "flex",
        cursor: "pointer",
        margin: "10px 0",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
      onClick={handleClick}
    >
      {previewData.images[0] && (
        <CardMedia
          component="img"
          sx={{ width: 120, height: 80, objectFit: "cover" }}
          image={previewData.images[0]}
          alt={previewData.title}
          onError={(e) => {
            // Hide image if it fails to load
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <CardContent sx={{ flex: 1, padding: "12px !important" }}>
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 0.5,
          }}
        >
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
            textOverflow: "ellipsis",
            marginBottom: 0.5,
          }}
        >
          {previewData.description}
        </Typography>
        <Typography
          variant="caption"
          color="primary"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            textDecoration: "none",
          }}
        >
          {new URL(url).hostname}
          <OpenInNew fontSize="small" />
        </Typography>
      </CardContent>
    </Card>
  );
};

export default UrlPreviewComponent;
