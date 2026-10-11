import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const entries = await db.entry.findMany({
    include: { chapter: true },
    orderBy: [{ eventYear: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-purple-900">Timeline</h1>
        <p className="text-stone-600 mt-1">Every recorded story, in order.</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-stone-500">Nothing recorded yet.</p>
      ) : (
        <ol className="space-y-3 border-l border-stone-200 pl-5">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-purple-900" />
              <Link href={`/chapters/${entry.chapterId}`} className="group">
                <p className="text-sm text-stone-500">
                  {entry.eventYear || "No year given"} · {entry.chapter.title}
                </p>
                <p className="font-medium text-stone-900 group-hover:underline">
                  {entry.title}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
