import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ChapterClient from "@/components/ChapterClient";

export const dynamic = "force-dynamic";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  if (!chapter) notFound();

  return <ChapterClient chapter={chapter} />;
}
