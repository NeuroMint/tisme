import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

export function absoluteStoragePath(relativePath: string) {
  return path.join(STORAGE_ROOT, relativePath);
}

/** Saves an uploaded file's bytes under storage/uploads and returns the relative path to store in the DB. */
export async function saveUpload(file: File, subdir: "audio" | "photos"): Promise<string> {
  const dir = path.join(STORAGE_ROOT, subdir);
  await fs.promises.mkdir(dir, { recursive: true });

  const ext = path.extname(file.name) || "";
  const name = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const relativePath = path.join(subdir, name);
  const absolutePath = path.join(STORAGE_ROOT, relativePath);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(absolutePath, buffer);

  return relativePath.split(path.sep).join("/");
}
