import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { Messagetype } from "types/types";
import MessageTimestamp from "./MessageTimestamp";
import { styled } from "@mui/material/styles";

interface ReplyMessageProps {
  message: Messagetype;
  renderBody: (msg: Messagetype) => React.ReactNode;
  isOriginalSender?: boolean;
}

const ReplyMessage = ({
  message,
  renderBody,
  isOriginalSender = false,
}: ReplyMessageProps) => {
  const theme = useTheme();

  return (
    <ReplyContainer isOriginalSender={isOriginalSender}>
      <ReplyContent isOriginalSender={isOriginalSender}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {message.sender}
        </Typography>

        <MessageContainer>
          <Box sx={{ pr: 5 }}>{renderBody(message)}</Box>
          <TimestampContainer>
            <MessageTimestamp timestamp={message.timestamp} />
          </TimestampContainer>
        </MessageContainer>
      </ReplyContent>
    </ReplyContainer>
  );
};

// Styled components
const ReplyContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isOriginalSender",
})<{ isOriginalSender: boolean }>(({ theme, isOriginalSender }) => ({
  alignSelf: isOriginalSender ? "flex-end" : "flex-start",
  paddingLeft: theme.spacing(2),
  paddingTop: theme.spacing(0.5),
  width: "70%",
}));

const ReplyContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isOriginalSender",
})<{ isOriginalSender: boolean }>(({ theme, isOriginalSender }) => ({
  borderLeft: `3px solid ${theme.palette.divider}`,
  paddingLeft: theme.spacing(1.5),
}));

const MessageContainer = styled(Box)({
  position: "relative",
});

const TimestampContainer = styled(Box)({
  position: "absolute",
  right: 8,
  bottom: 0,
});

export default ReplyMessage;
