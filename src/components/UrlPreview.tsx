// src/components/UrlPreview.tsx
import React from "react";
import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

interface UrlPreviewProps {
  title: string;
  description: string;
  image: string;
  url: string;
}

const UrlPreview: React.FC<UrlPreviewProps> = ({
  title,
  description,
  image,
  url,
}) => {
  return (
    <PreviewContainer>
      {image && <PreviewImage src={image} alt={title} />}
      <PreviewContent>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {description}
        </Typography>
        <Typography variant="body2" color="primary">
          {url}
        </Typography>
      </PreviewContent>
    </PreviewContainer>
  );
};

export default UrlPreview;

const PreviewContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: "8px",
  overflow: "hidden",
  margin: "10px 0",
}));

const PreviewImage = styled("img")({
  width: "120px",
  height: "80px",
  objectFit: "cover",
});

const PreviewContent = styled(Box)({
  padding: "10px",
  flex: 1,
});
