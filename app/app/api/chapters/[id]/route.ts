import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chapter = await db.chapter.findUnique({
    where: { id: Number(id) },
    include: {
      questions: { orderBy: { id: "asc" } },
      entries: {
        orderBy: { createdAt: "desc" },
        include: { media: true, question: true },
      },
    },
  });
  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }
  return NextResponse.json(chapter);
}
