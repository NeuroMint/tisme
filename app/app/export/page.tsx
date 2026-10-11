import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const entryCount = await db.entry.count();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-purple-900">Export</h1>
        <p className="text-stone-600 mt-1">
          Compile everything recorded so far into one manuscript, grouped by part and
          chapter, in the order from the chapter outline.
        </p>
      </div>

      <a
        href="/api/export"
        className="inline-block rounded bg-purple-900 text-white text-sm px-4 py-2"
      >
        Download manuscript ({entryCount} {entryCount === 1 ? "entry" : "entries"})
      </a>

      <p className="text-sm text-stone-500">
        This also saves a copy to <code>archive/02-autobiography-draft/manuscript.md</code>
        {" "}in the project repo, each time you export.
      </p>
    </div>
  );
}
