import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { Box } from "@mui/material";
import { blue, grey } from "@mui/material/colors";
import { Messagetype } from "@/types";

const Checkmarks = ({
  message,
  isSender,
  currentUserEmail,
}: {
  message: Messagetype;
  isSender: boolean;
  currentUserEmail: string;
}) => {
  if (!isSender) return null;

  const hasRead = Array.isArray(message.readBy) && message.readBy.length > 0;
  const hasDelivered =
    Array.isArray(message.deliveredTo) && message.deliveredTo.length > 0;

  const color = hasRead ? blue[400] : hasDelivered ? grey[600] : grey[400];
  // console.log(
  //   "sender",
  //   message.sender,
  //   "user",
  //   currentUserEmail,
  //   "isSender",
  //   isSender
  // );
  return (
    <Box
      sx={{
        ml: 1,
        display: "flex",
        alignItems: "center",
        color,
      }}
    >
      {hasRead ? (
        <Box
          sx={{
            position: "relative",
            width: 22,
            height: 18,
            display: "inline-block",
            overflow: "visible",
          }}
        >
          <DoneAllIcon
            sx={{
              fontSize: 18,
              position: "absolute",
              left: 0,
              top: 0,
            }}
          />
          <DoneAllIcon
            sx={{
              fontSize: 18,
              position: "absolute",
              left: 4,
              top: 0,
            }}
          />
        </Box>
      ) : hasDelivered ? (
        <DoneAllIcon sx={{ fontSize: 18 }} />
      ) : (
        <DoneIcon sx={{ fontSize: 18 }} />
      )}
    </Box>
  );
};

export default Checkmarks;
