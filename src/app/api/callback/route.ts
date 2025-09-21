import { NextRequest, NextResponse } from "next/server";
import { broadcastToClients } from "../stream/route";

export async function POST(req: NextRequest) {
  const data = await req.json();

  // Broadcast webhook payload to all SSE clients
  broadcastToClients(data);

  return NextResponse.json({ received: true });
}
