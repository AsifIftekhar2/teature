"use client";
import { useEffect, useState } from "react";

export default function LectureInformation() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/stream");

    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch (error) {
        console.error("Failed to parse SSE message:", event.data);
        // Handle non-JSON messages
        setMessages((prev) => [...prev, { type: "error", message: event.data }]);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Live Webhook Updates</h1>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>{JSON.stringify(m)}</li>
        ))}
      </ul>
    </main>
  );
}