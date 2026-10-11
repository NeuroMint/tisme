import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const chapters = await db.chapter.findMany({
    orderBy: { number: "asc" },
    include: { _count: { select: { questions: true, entries: true } } },
  });

  const parts = new Map<string, typeof chapters>();
  for (const chapter of chapters) {
    const list = parts.get(chapter.part) ?? [];
    list.push(chapter);
    parts.set(chapter.part, list);
  }

  const totalEntries = chapters.reduce((sum, c) => sum + c._count.entries, 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-purple-900">My Life. My Story.</h1>
        <p className="text-stone-600 mt-1">
          {totalEntries === 0
            ? "Nothing recorded yet — pick a chapter below and answer one question to start."
            : `${totalEntries} ${totalEntries === 1 ? "story" : "stories"} recorded so far.`}
        </p>
      </div>

      {[...parts.entries()].map(([part, partChapters]) => (
        <section key={part}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">
            {part}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {partChapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/chapters/${chapter.id}`}
                className="block rounded-lg border border-stone-200 bg-white p-4 hover:border-purple-300 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900">
                    {chapter.number}. {chapter.title}
                  </span>
                  <span className="text-xs text-stone-500 whitespace-nowrap ml-2">
                    {chapter._count.entries}/{chapter._count.questions || "–"}
                  </span>
                </div>
                <p className="text-sm text-stone-500 mt-1">{chapter.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
