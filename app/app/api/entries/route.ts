import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { draftNarrative, hasNarrativeDrafting } from "@/lib/ai";

export async function POST(req: Request) {
  const body = await req.json();
  const { chapterId, questionId, title, eventYear, rawText } = body as {
    chapterId: number;
    questionId?: number | null;
    title: string;
    eventYear?: string | null;
    rawText: string;
  };

  if (!chapterId || !title || !rawText) {
    return NextResponse.json(
      { error: "chapterId, title and rawText are required" },
      { status: 400 }
    );
  }

  const chapter = await db.chapter.findUnique({ where: { id: Number(chapterId) } });
  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  let draftText = rawText;
  let draftStatus = "UNAVAILABLE";

  if (hasNarrativeDrafting()) {
    try {
      const question = questionId
        ? await db.question.findUnique({ where: { id: Number(questionId) } })
        : null;
      const drafted = await draftNarrative({
        chapterTitle: chapter.title,
        questionText: question?.text,
        rawText,
      });
      if (drafted) {
        draftText = drafted;
        draftStatus = "AI";
      }
    } catch (err) {
      console.error("draftNarrative failed", err);
    }
  }

  const entry = await db.entry.create({
    data: {
      title,
      type: "TEXT",
      eventYear: eventYear || null,
      rawText,
      transcriptStatus: "NONE",
      draftText,
      draftStatus,
      chapterId: Number(chapterId),
      questionId: questionId ? Number(questionId) : null,
    },
    include: { media: true, question: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
