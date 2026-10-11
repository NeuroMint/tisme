import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const chapters = await db.chapter.findMany({
    orderBy: { number: "asc" },
    include: {
      _count: { select: { questions: true, entries: true } },
    },
  });
  return NextResponse.json(chapters);
}
