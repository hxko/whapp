import React from "react";
import { Box, Typography } from "@mui/material";
import { Messagetype } from "types/types";
import UrlPreviewComponent from "@/components/UrlPreviewComponent";
import { styled } from "@mui/material/styles";

interface ReplyPreviewProps {
  message: Messagetype;
  onCancel: () => void;
  chatId?: string;
}

const ReplyPreview = ({ message, onCancel, chatId }: ReplyPreviewProps) => {
  const isUrl = isValidUrl(message.text);

  return (
    <PreviewContainer>
      <PreviewHeader>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: "text.secondary",
          }}
        >
          Replying to: {message.sender}
        </Typography>
        <CancelButton onClick={onCancel}>×</CancelButton>
      </PreviewHeader>

      <PreviewContent>
        {isUrl && chatId ? (
          <UrlPreviewComponent
            url={message.text}
            timestamp={message.timestamp}
            chatId={chatId}
            messageId={message.id}
          />
        ) : (
          <Typography
            sx={{
              fontSize: "0.875rem",
              maxWidth: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {message.text}
          </Typography>
        )}
      </PreviewContent>
    </PreviewContainer>
  );
};

const isValidUrl = (string: string) => {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" +
      "((([a-z0-9\\-]+\\.)+[a-z]{2,})|localhost|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|\\[?[a-f0-9:\\.]+\\])" +
      "(\\:\\d+)?(\\/[-a-z0-9%_.~+]*)*" +
      "(\\?[;&a-z0-9%_.~+=-]*)?" +
      "(\\#[-a-z0-9_]*)?$",
    "i"
  );
  return !!pattern.test(string);
};

const PreviewContainer = styled(Box)(({ theme }) => ({
  width: "70%",
  backgroundColor: theme.palette.background.paper,
  borderLeft: `3px solid ${theme.palette.divider}`,
  padding: theme.spacing(1),
  paddingLeft: theme.spacing(1.5),
  margin: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
}));

const PreviewHeader = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "4px",
});

const PreviewContent = styled(Box)({
  maxWidth: "100%",
  overflow: "hidden",
});

const CancelButton = styled("button")(({ theme }) => ({
  background: "none",
  border: "none",
  color: theme.palette.text.secondary,
  cursor: "pointer",
  fontSize: "1.2rem",
  padding: "0 4px",
  "&:r": {
    color: theme.palette.text.primary,
  },
}));

export default ReplyPreview;
