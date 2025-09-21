import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    // Read the request for error checking.

    const readFilePath = path.join(process.cwd(), "uploads", "process.txt");
    const content = await fs.readFile(readFilePath, "utf-8");

    // Rewrite file with different name so it doesn't get processed again
    const writeFilePath = path.join(process.cwd(), "uploads", "processed.txt");
    await fs.writeFile(writeFilePath, content, "utf-8");

    const prompt = "Give me a title, a summary, and a quiz from the following lecture transcript. Also ask the firecrawl agent for links to 3 websites to further study the lecture concepts. Provide the outputs in JSON format. Add a 'links' property to the JSON output that the tutor agent gives you and put the firecrawl agent's links in an array for the property value. DO NOT output anything else or wrap the JSON string in any other text. Transcript: "
    
    return new NextResponse((prompt + content), {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
      return NextResponse.json(
        { error: "Could not read file", details: error.message },
        { status: 500 }
      );
  }
}
