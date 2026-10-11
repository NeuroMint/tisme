import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = await db.entry.findUnique({
    where: { id: Number(id) },
    include: { media: true, question: true, chapter: true },
  });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, eventYear, draftText, transcript } = body as {
    title?: string;
    eventYear?: string | null;
    draftText?: string;
    transcript?: string;
  };

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (eventYear !== undefined) data.eventYear = eventYear;
  if (draftText !== undefined) {
    data.draftText = draftText;
    data.draftStatus = "MANUAL";
  }
  if (transcript !== undefined) {
    data.transcript = transcript;
    data.transcriptStatus = "DONE";
  }

  const entry = await db.entry.update({
    where: { id: Number(id) },
    data,
    include: { media: true, question: true },
  });
  return NextResponse.json(entry);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.mediaFile.deleteMany({ where: { entryId: Number(id) } });
  await db.entry.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
