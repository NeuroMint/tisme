import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const chapters = await db.chapter.findMany({
    orderBy: { number: "asc" },
    include: {
      entries: { orderBy: [{ eventYear: "asc" }, { createdAt: "asc" }] },
    },
  });

  const parts = new Map<string, typeof chapters>();
  for (const chapter of chapters) {
    const list = parts.get(chapter.part) ?? [];
    list.push(chapter);
    parts.set(chapter.part, list);
  }

  const lines: string[] = ["# My Life — Stories, Decisions and Values", ""];

  for (const [part, partChapters] of parts) {
    lines.push(`## Part — ${part}`, "");
    for (const chapter of partChapters) {
      lines.push(`### Chapter ${chapter.number} — ${chapter.title}`, "");
      if (chapter.entries.length === 0) {
        lines.push("_No entries yet._", "");
        continue;
      }
      for (const entry of chapter.entries) {
        const text = entry.draftText || entry.rawText || entry.transcript || "";
        const yearPrefix = entry.eventYear ? `**${entry.eventYear}** — ` : "";
        lines.push(`${yearPrefix}${entry.title}`, "", text, "");
      }
    }
  }

  const manuscript = lines.join("\n");

  // Keep a copy alongside the rest of the project's written material.
  try {
    const archiveDir = path.join(process.cwd(), "..", "archive", "02-autobiography-draft");
    await fs.promises.mkdir(archiveDir, { recursive: true });
    await fs.promises.writeFile(path.join(archiveDir, "manuscript.md"), manuscript, "utf8");
  } catch (err) {
    console.error("Failed to write manuscript copy to archive/", err);
  }

  return new NextResponse(manuscript, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": "attachment; filename=tisme-manuscript.md",
    },
  });
}
