import { NextRequest } from "next/server";

let clients: { id: number; send: (msg: string) => void }[] = [];
let counter = 0;

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const id = counter++;
      const encoder = new TextEncoder();

      const send = (msg: string) => {
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
      };

      clients.push({ id, send });

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clients = clients.filter(c => c.id !== id);
      });

      send(JSON.stringify({ type: "connected", message: "Connected to server" }));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export function broadcastToClients(message: any) {
  const msg = JSON.stringify(message);
  clients.forEach(c => c.send(msg));
}