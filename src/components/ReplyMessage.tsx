import React from "react";
import { Box, Typography } from "@mui/material";
import { Messagetype } from "types/types";

const ReplyMessage = ({
  message,
  renderBody,
}: {
  message: Messagetype;
  renderBody: (msg: Messagetype) => React.ReactNode;
}) => {
  return (
    <Box sx={{ pl: 2, pt: 1 }}>
      <Box
        sx={{
          borderLeft: "4px solid #ccc",
          padding: "8px",
          borderRadius: "4px",
        }}
      >
        <Typography variant="caption" color="textSecondary">
          {message.sender}
        </Typography>
        {renderBody(message)}
      </Box>
    </Box>
  );
};

export default ReplyMessage;
