import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { draftNarrative, hasNarrativeDrafting } from "@/lib/ai";

/** (Re)run AI narrative drafting on an entry's current text/transcript. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = await db.entry.findUnique({
    where: { id: Number(id) },
    include: { chapter: true, question: true },
  });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const source = entry.rawText || entry.transcript;
  if (!source) {
    return NextResponse.json(
      { error: "No text or transcript available to draft from yet" },
      { status: 400 }
    );
  }

  if (!hasNarrativeDrafting()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 400 }
    );
  }

  const drafted = await draftNarrative({
    chapterTitle: entry.chapter.title,
    questionText: entry.question?.text,
    rawText: source,
  });

  if (!drafted) {
    return NextResponse.json({ error: "Drafting failed" }, { status: 500 });
  }

  const updated = await db.entry.update({
    where: { id: entry.id },
    data: { draftText: drafted, draftStatus: "AI" },
    include: { media: true, question: true },
  });

  return NextResponse.json(updated);
}
