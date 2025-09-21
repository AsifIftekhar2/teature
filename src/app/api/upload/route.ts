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
  const filePath = path.join(uploadDir, "process.txt");
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

  if (transcript === undefined) {
    return NextResponse.json({ error: "ElevenLabs API error" }, { status: 400 });
  }

  // Save transcript to storage
  await fs.writeFile(filePath, transcript, "utf-8");

  const coralRes = await fetch('http://localhost:5555/api/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "applicationId": "app",
        "sessionId": "session1",
        "privacyKey": "priv",
        "agentGraphRequest": {
          "agents": [
            {
              "id": {
                "name": "interface",
                "version": "0.0.1"
              },
              "name": "interface",
              "coralPlugins": [],
              "provider": {
                "type": "local",
                "runtime": "executable"
              },
              "blocking": true,
              "options": {
                "MODEL_API_KEY": {
                  "type": "string",
                  "value": process.env.MODEL_API_KEY
                }
              },
              "customToolAccess": [
                "user-input-request",
                "user-input-respond"
              ]
            },
            {
              "id": {
                "name": "tutor",
                "version": "0.0.1"
              },
              "name": "tutor",
              "coralPlugins": [],
              "provider": {
                "type": "local",
                "runtime": "executable"
              },
              "blocking": true,
              "options": {
                "MODEL_API_KEY": {
                  "type": "string",
                  "value": process.env.MODEL_API_KEY
                }
              },
              "customToolAccess": []
            },
            {
              "id": {
                "name": "firecrawl",
                "version": "0.0.1"
              },
              "name": "firecrawl",
              "coralPlugins": [],
              "provider": {
                "type": "local",
                "runtime": "executable"
              },
              "blocking": true,
              "options": {
                "MODEL_API_KEY": {
                  "type": "string",
                  "value": process.env.MODEL_API_KEY
                },
                "FIRECRAWL_API_KEY": {
                  "type": "string",
                  "value": process.env.FIRECRAWL_API_KEY
                }
              },
              "customToolAccess": []
            }
          ],
          "customTools": {
            "user-input-request": {
              "transport": {
                "type": "http",
                "url": "http://localhost:3000/api/lecture-request"
              },
              "toolSchema": {
                "name": "request-question",
                "description": "Request a question from the user. Hangs until input is received.",
                "inputSchema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "description": "Message to show to the user."
                    }
                  }
                }
              }
            },
            "user-input-respond": {
              "transport": {
                "type": "http",
                "url": "http://localhost:3000/api/callback"
              },
              "toolSchema": {
                "name": "answer-question",
                "description": "Answer the last question you requested from the user. You can only respond once, and will have to request more input later.",
                "inputSchema": {
                  "type": "object",
                  "properties": {
                    "response": {
                      "type": "string",
                      "description": "Answer to show to the user."
                    }
                  },
                  "required": [
                    "response"
                  ]
                }
              }
            }
          },
          "groups": [
            [
              "interface",
              "tutor",
              "firecrawl"
            ]
          ]
        }
      })
  })

  return NextResponse.json({ success: true });
}