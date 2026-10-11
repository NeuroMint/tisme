import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const entries = await db.entry.findMany({
    include: { chapter: true, question: true, media: true },
    orderBy: [{ eventYear: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(entries);
}
