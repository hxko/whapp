// components/Loading.tsx
import React, { useEffect, useState } from "react";
import { CircularProgress, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled Container
const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  backgroundColor: theme.palette.background.default,
}));

// Loading Component
const Loading = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This will run only on the client
    setIsClient(true);
  }, []);

  // Render nothing on the server
  if (!isClient) {
    return null;
  }

  return (
    <LoadingContainer>
      <CircularProgress size={50} color="primary" />
      <Typography variant="h6" sx={{ marginTop: 2, color: "#333" }}>
        Loading...
      </Typography>
    </LoadingContainer>
  );
};

export default Loading;
