import React, { useEffect, useRef } from "react";
import {
  Messagetype,
  MarkAsReadFunction,
  MarkAsDeliveredFunction,
} from "@/types";
import { Timestamp } from "firebase/firestore"; // Import Timestamp if not already there

interface MessageObserverProps {
  message: Messagetype;
  chatId: string;
  children: React.ReactNode;
  markAsRead: MarkAsReadFunction;
  markAsDelivered: MarkAsDeliveredFunction;
  userEmail: string;
  // NEW PROP: Indicates if this is the very latest message in the entire chat
  isLatestMessageInChat: boolean;
}

function MessageObserver({
  message,
  chatId,
  children,
  markAsRead,
  markAsDelivered,
  userEmail,
  isLatestMessageInChat,
}: MessageObserverProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Mark main message as delivered if not already
            if (!message.deliveredTo?.includes(userEmail)) {
              markAsDelivered(chatId, userEmail, message.id);
            }

            // CRITICAL LOGIC FOR UNREAD COUNT WITH REACTIONS:
            // If this is the latest message in the chat AND it's not sent by the current user,
            // then mark this specific message as read.
            // This will trigger updateLastReadTimestampInFirestore in MessagesProvider
            // with this message's updatedAt, effectively clearing unread for new activity.
            if (isLatestMessageInChat && message.sender !== userEmail) {
              markAsRead(chatId, userEmail, message.id);
            } else if (
              !message.readBy?.includes(userEmail) &&
              message.sender !== userEmail
            ) {
              // Also mark other, non-latest messages as read if they haven't been read yet.
              // This is for ensuring individual messages get their readBy updated.
              // This might be less critical if `isLatestMessageInChat` always ensures the chat's
              // lastReadTimestamp is updated, but it helps for individual message read receipts.

              markAsRead(chatId, userEmail, message.id);
            }
          }
        });
      },
      // Using a threshold that ensures most of the message is visible before marking it as read
      { threshold: 0.6 } // Adjust as needed, e.g., 0.5 means 50% of the message must be visible
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [
    message,
    userEmail,
    markAsRead,
    markAsDelivered,
    chatId,
    isLatestMessageInChat,
  ]); // Added isLatestMessageInChat to dependencies

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

export default MessageObserver;
