import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Check MIME type
  if (!file.type.startsWith("video/") && !file.type.startsWith("audio/") && !file.type.startsWith("text/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const uploadDir = path.join(process.cwd(), "uploads");
  let filePath = path.join(uploadDir, file.name);
  let transcript: string | undefined;

  // Ensure uploads directory exists
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Just write a text transcript directly to storage
  if (file.type.startsWith("text/") && file.name.endsWith(".txt")) {
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);
  }
  else {
    const blob = new Blob([bytes], { type: file.type });
    const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

    // Convert audio to text
    const elevenRes = await elevenlabs.speechToText.convert({
        file: blob,
        modelId: "scribe_v1", // Model to use, for now only "scribe_v1" is supported
    });
    console.log(elevenRes);

    if ("text" in elevenRes && typeof elevenRes.text === "string") {
      transcript = elevenRes.text;
    } else {
      transcript = undefined;
    }
  }

  if (transcript !== undefined) {
    const newFilename = path.basename(file.name, path.extname(file.name)) + ".txt";
    filePath = path.join(uploadDir, newFilename);
    await fs.writeFile(filePath, transcript, "utf-8");
  }

  return NextResponse.json({ success: true, type: file.type, path: filePath, transcript });
}