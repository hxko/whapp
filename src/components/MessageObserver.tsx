import React, { useEffect, useRef } from "react";
import { Messagetype } from "@/types/types";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

function MessageObserver({
  message,
  chatId,
  children,
  markAsRead,
  markAsDelivered,
  userEmail,
  className,
}: {
  message: Messagetype;
  chatId: string;
  children: React.ReactNode;
  markAsRead: (
    chatId: string,
    userEmail: string,
    messageId: string
  ) => void | Promise<void>;
  markAsDelivered: (
    chatId: string,
    userEmail: string,
    messageId: string
  ) => void | Promise<void>;
  userEmail: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // deliveredTo prüfen und markieren
            if (!message.deliveredTo?.includes(userEmail)) {
              markAsDelivered(chatId, userEmail, message.id);
            }
            // readBy prüfen und markieren
            if (!message.readBy?.includes(userEmail)) {
              markAsRead(chatId, userEmail, message.id);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [message, userEmail, markAsRead]);

  return (
    <MessageContainer ref={ref} className={className}>
      {children}
    </MessageContainer>
  );
}

export default MessageObserver;
/**
 * Main message container with hover effects and positioning
 * Handles alignment for current user vs other user messages
 * Includes hover effects for emoji reaction button
 */
const MessageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(1),
  marginTop: theme.spacing(1),
  maxWidth: "90%",
  [theme.breakpoints.up("lg")]: {
    maxWidth: "70%",
  },
  position: "relative",

  // Emoji button hover effects
  "& .emoji-hover-button": {
    opacity: 0,
    visibility: "hidden",
    transition: "opacity 0.2s ease, visibility 0.2s ease",
  },

  "&:hover .emoji-hover-button": {
    opacity: 1,
    visibility: "visible",
  },

  // Positioning for current user messages (right-aligned)
  "&.current-user": {
    alignSelf: "flex-end",

    "& .emoji-hover-button": {
      position: "absolute",
      top: "50%",
      left: "-35px",
      transform: "translateY(-50%)",
      zIndex: 1,
    },
  },

  // Positioning for other user messages (left-aligned)
  "&.other-user": {
    alignSelf: "flex-start",

    "& .emoji-hover-button": {
      position: "absolute",
      top: "50%",
      right: "-35px",
      transform: "translateY(-50%)",
      zIndex: 1,
    },
  },
}));
