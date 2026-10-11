import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight text-purple-900">
          Tisme
        </Link>
        <nav className="flex gap-5 text-sm font-medium text-stone-600">
          <Link href="/" className="hover:text-purple-900">
            Chapters
          </Link>
          <Link href="/timeline" className="hover:text-purple-900">
            Timeline
          </Link>
          <Link href="/export" className="hover:text-purple-900">
            Export
          </Link>
        </nav>
      </div>
    </header>
  );
}
