import React, { useEffect, useRef } from "react";
import {
  Messagetype,
  MarkAsReadFunction,
  MarkAsDeliveredFunction,
} from "@/types";

function MessageObserver({
  message,
  chatId,
  children,
  markAsRead,
  markAsDelivered,
  userEmail,
}: {
  message: Messagetype;
  chatId: string;
  children: React.ReactNode;
  markAsRead: MarkAsReadFunction;
  markAsDelivered: MarkAsDeliveredFunction;
  userEmail: string;
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
    <div
      ref={ref}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {children}{" "}
    </div>
  );
}

export default MessageObserver;
