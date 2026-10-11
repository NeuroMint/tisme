import fs from "node:fs";
import { NextResponse } from "next/server";
import { absoluteStoragePath } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const relativePath = segments.join("/");

  // Guard against path traversal outside storage/uploads.
  if (relativePath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const absolutePath = absoluteStoragePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = absolutePath.slice(absolutePath.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
  const data = await fs.promises.readFile(absolutePath);

  return new NextResponse(data, { headers: { "Content-Type": contentType } });
}
