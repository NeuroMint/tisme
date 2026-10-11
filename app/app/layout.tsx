import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Tisme — My Life. My Story.",
  description: "A private autobiography and family legacy archive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <Nav />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
