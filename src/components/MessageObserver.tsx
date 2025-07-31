import React, { useEffect, useRef } from "react";
import {
  Messagetype,
  MarkAsReadFunction,
  MarkAsDeliveredFunction,
} from "@/types";

interface MessageObserverProps {
  message: Messagetype;
  chatId: string;
  children: React.ReactNode;
  markAsRead: MarkAsReadFunction;
  markAsDelivered: MarkAsDeliveredFunction;
  userEmail: string;
  // Optional: If you want to handle replies explicitly here
  replies?: Messagetype[];
}

function MessageObserver({
  message,
  chatId,
  children,
  markAsRead,
  markAsDelivered,
  userEmail,
  replies = [],
}: MessageObserverProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Mark main message as delivered
            if (!message.deliveredTo?.includes(userEmail)) {
              markAsDelivered(chatId, userEmail, message.id);
            }
            // Mark main message as read
            if (!message.readBy?.includes(userEmail)) {
              markAsRead(chatId, userEmail, message.id);
            }

            // Also check and mark replies as read and delivered if needed
            replies.forEach((reply) => {
              if (!reply.deliveredTo?.includes(userEmail)) {
                markAsDelivered(chatId, userEmail, reply.id);
              }
              if (!reply.readBy?.includes(userEmail)) {
                markAsRead(chatId, userEmail, reply.id);
              }
            });
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [message, userEmail, markAsRead, markAsDelivered, chatId, replies]);

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
