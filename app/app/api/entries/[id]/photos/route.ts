import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/storage";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await req.formData();
  const file = form.get("photo") as File | null;
  const caption = form.get("caption") as string | null;

  if (!file) {
    return NextResponse.json({ error: "photo file is required" }, { status: 400 });
  }

  const entry = await db.entry.findUnique({ where: { id: Number(id) } });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const photoPath = await saveUpload(file, "photos");

  const media = await db.mediaFile.create({
    data: {
      kind: "PHOTO",
      path: photoPath,
      caption: caption || null,
      entryId: entry.id,
    },
  });

  return NextResponse.json(media, { status: 201 });
}
