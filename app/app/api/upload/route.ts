import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveUpload, absoluteStoragePath } from "@/lib/storage";
import { transcribeAudio, draftNarrative, hasTranscription, hasNarrativeDrafting } from "@/lib/ai";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio") as File | null;
  const chapterId = form.get("chapterId") as string | null;
  const questionId = form.get("questionId") as string | null;
  const title = form.get("title") as string | null;
  const eventYear = form.get("eventYear") as string | null;

  if (!file || !chapterId || !title) {
    return NextResponse.json(
      { error: "audio file, chapterId and title are required" },
      { status: 400 }
    );
  }

  const chapter = await db.chapter.findUnique({ where: { id: Number(chapterId) } });
  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const audioPath = await saveUpload(file, "audio");

  let entry = await db.entry.create({
    data: {
      title,
      type: "AUDIO",
      eventYear: eventYear || null,
      audioPath,
      transcriptStatus: hasTranscription() ? "PENDING" : "UNAVAILABLE",
      draftStatus: "NONE",
      chapterId: Number(chapterId),
      questionId: questionId ? Number(questionId) : null,
    },
    include: { media: true, question: true },
  });

  if (hasTranscription()) {
    try {
      const transcript = await transcribeAudio(absoluteStoragePath(audioPath));
      let draftText: string | null = null;
      let draftStatus = "UNAVAILABLE";

      if (transcript && hasNarrativeDrafting()) {
        try {
          draftText = await draftNarrative({
            chapterTitle: chapter.title,
            questionText: entry.question?.text,
            rawText: transcript,
          });
          if (draftText) draftStatus = "AI";
        } catch (err) {
          console.error("draftNarrative failed", err);
        }
      }
      if (!draftText && transcript) {
        draftText = transcript;
      }

      entry = await db.entry.update({
        where: { id: entry.id },
        data: {
          transcript,
          transcriptStatus: transcript ? "DONE" : "FAILED",
          draftText,
          draftStatus,
        },
        include: { media: true, question: true },
      });
    } catch (err) {
      console.error("transcribeAudio failed", err);
      entry = await db.entry.update({
        where: { id: entry.id },
        data: { transcriptStatus: "FAILED" },
        include: { media: true, question: true },
      });
    }
  }

  return NextResponse.json(entry, { status: 201 });
}
