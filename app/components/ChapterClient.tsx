"use client";

import { useRef, useState } from "react";
import type { Chapter, Question, Entry, MediaFile } from "@prisma/client";

type EntryWithRelations = Entry & { media: MediaFile[]; question: Question | null };
type ChapterWithRelations = Chapter & {
  questions: Question[];
  entries: EntryWithRelations[];
};

export default function ChapterClient({ chapter }: { chapter: ChapterWithRelations }) {
  const [entries, setEntries] = useState<EntryWithRelations[]>(chapter.entries);
  const [openComposer, setOpenComposer] = useState<number | "freeform" | null>(null);

  const answeredQuestionIds = new Set(
    entries.map((e) => e.questionId).filter((id): id is number => id !== null)
  );

  function onCreated(entry: EntryWithRelations) {
    setEntries((prev) => [entry, ...prev]);
    setOpenComposer(null);
  }

  function onUpdated(entry: EntryWithRelations) {
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
  }

  function onDeleted(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-stone-500">{chapter.part}</p>
        <h1 className="text-2xl font-bold text-purple-900">
          {chapter.number}. {chapter.title}
        </h1>
        <p className="text-stone-600 mt-1">{chapter.description}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">
          Questions to get you started
        </h2>
        <ul className="space-y-2">
          {chapter.questions.map((q) => (
            <li key={q.id} className="rounded-lg border border-stone-200 bg-white">
              <button
                onClick={() => setOpenComposer(openComposer === q.id ? null : q.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-stone-900">{q.text}</span>
                <span className="text-xs text-stone-500 whitespace-nowrap">
                  {answeredQuestionIds.has(q.id) ? "answered" : "answer →"}
                </span>
              </button>
              {openComposer === q.id && (
                <div className="border-t border-stone-200 p-4">
                  <Composer
                    chapterId={chapter.id}
                    questionId={q.id}
                    defaultTitle={q.text}
                    onCreated={onCreated}
                    onCancel={() => setOpenComposer(null)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <button
          onClick={() => setOpenComposer(openComposer === "freeform" ? null : "freeform")}
          className="text-sm font-medium text-purple-900 hover:underline"
        >
          + Add a free-form story for this chapter
        </button>
        {openComposer === "freeform" && (
          <div className="mt-3 rounded-lg border border-stone-200 bg-white p-4">
            <Composer
              chapterId={chapter.id}
              questionId={null}
              defaultTitle=""
              onCreated={onCreated}
              onCancel={() => setOpenComposer(null)}
            />
          </div>
        )}
      </section>

      {entries.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">
            Recorded so far
          </h2>
          <div className="space-y-4">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onUpdated={onUpdated}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Composer({
  chapterId,
  questionId,
  defaultTitle,
  onCreated,
  onCancel,
}: {
  chapterId: number;
  questionId: number | null;
  defaultTitle: string;
  onCreated: (e: EntryWithRelations) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"text" | "record">("text");
  const [title, setTitle] = useState(defaultTitle);
  const [eventYear, setEventYear] = useState("");
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Couldn't access the microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function submit() {
    setError(null);
    const finalTitle = title.trim() || "Untitled story";

    if (mode === "text") {
      if (!text.trim()) {
        setError("Write something first, or switch to recording.");
        return;
      }
      setSubmitting(true);
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          questionId,
          title: finalTitle,
          eventYear: eventYear || null,
          rawText: text,
        }),
      });
      setSubmitting(false);
      if (!res.ok) {
        setError("Something went wrong saving that.");
        return;
      }
      onCreated(await res.json());
      return;
    }

    if (!audioBlob) {
      setError("Record something first, or switch to typing.");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.append("audio", audioBlob, "recording.webm");
    form.append("chapterId", String(chapterId));
    if (questionId) form.append("questionId", String(questionId));
    form.append("title", finalTitle);
    if (eventYear) form.append("eventYear", eventYear);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setSubmitting(false);
    if (!res.ok) {
      setError("Something went wrong uploading that.");
      return;
    }
    onCreated(await res.json());
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={mode === "text"}
            onChange={() => setMode("text")}
          />
          Type an answer
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={mode === "record"}
            onChange={() => setMode("record")}
          />
          Record a voice memo
        </label>
      </div>

      <div className="flex gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title for this story"
          className="flex-1 rounded border border-stone-300 px-3 py-1.5 text-sm"
        />
        <input
          value={eventYear}
          onChange={(e) => setEventYear(e.target.value)}
          placeholder="Year (e.g. 1983)"
          className="w-36 rounded border border-stone-300 px-3 py-1.5 text-sm"
        />
      </div>

      {mode === "text" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Write as much or as little as you like — rough notes are fine."
          className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
        />
      ) : (
        <div className="flex items-center gap-3">
          {!recording ? (
            <button
              onClick={startRecording}
              className="rounded bg-purple-900 text-white text-sm px-4 py-1.5"
            >
              ● Start recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="rounded bg-red-700 text-white text-sm px-4 py-1.5 animate-pulse"
            >
              ■ Stop recording
            </button>
          )}
          {audioBlob && !recording && (
            <audio controls src={URL.createObjectURL(audioBlob)} className="h-9" />
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded bg-purple-900 text-white text-sm px-4 py-1.5 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="text-sm text-stone-500 px-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

function EntryCard({
  entry,
  onUpdated,
  onDeleted,
}: {
  entry: EntryWithRelations;
  onUpdated: (e: EntryWithRelations) => void;
  onDeleted: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(entry.draftText || "");
  const [busy, setBusy] = useState(false);

  async function saveDraft() {
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftText }),
    });
    setBusy(false);
    if (res.ok) {
      onUpdated(await res.json());
      setEditing(false);
    }
  }

  async function rerunAiDraft() {
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}/draft`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
      setDraftText(updated.draftText || "");
    }
  }

  async function saveTranscript(transcript: string) {
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    setBusy(false);
    if (res.ok) onUpdated(await res.json());
  }

  async function addPhoto(file: File) {
    setBusy(true);
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch(`/api/entries/${entry.id}/photos`, {
      method: "POST",
      body: form,
    });
    setBusy(false);
    if (res.ok) {
      const media = await res.json();
      onUpdated({ ...entry, media: [...entry.media, media] });
    }
  }

  async function del() {
    if (!confirm("Delete this entry? This can't be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onDeleted(entry.id);
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-stone-900">
            {entry.eventYear && <span className="text-stone-500">{entry.eventYear} — </span>}
            {entry.title}
          </p>
          {entry.question && (
            <p className="text-xs text-stone-500 mt-0.5">In answer to: {entry.question.text}</p>
          )}
        </div>
        <button onClick={del} disabled={busy} className="text-xs text-red-700 hover:underline">
          Delete
        </button>
      </div>

      {entry.type === "AUDIO" && entry.audioPath && (
        <audio controls src={`/api/files/${entry.audioPath}`} className="w-full" />
      )}

      {entry.type === "AUDIO" && entry.transcriptStatus === "PENDING" && (
        <p className="text-xs text-amber-700">Transcribing…</p>
      )}
      {entry.type === "AUDIO" && entry.transcriptStatus === "UNAVAILABLE" && !entry.transcript && (
        <TranscriptFallback onSave={saveTranscript} />
      )}
      {entry.type === "AUDIO" && entry.transcriptStatus === "FAILED" && (
        <p className="text-xs text-red-700">
          Automatic transcription failed. You can type it in below.
          <TranscriptFallback onSave={saveTranscript} />
        </p>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs uppercase tracking-wide text-stone-500">
            {entry.draftStatus === "AI"
              ? "AI-polished draft"
              : entry.draftStatus === "MANUAL"
                ? "Edited draft"
                : "Draft (raw, not yet polished)"}
          </span>
          <div className="flex gap-3 text-xs">
            {(entry.rawText || entry.transcript) && (
              <button onClick={rerunAiDraft} disabled={busy} className="text-purple-900 hover:underline">
                Polish with AI
              </button>
            )}
            <button onClick={() => setEditing((v) => !v)} className="text-stone-600 hover:underline">
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={6}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
            />
            <button
              onClick={saveDraft}
              disabled={busy}
              className="rounded bg-purple-900 text-white text-sm px-4 py-1.5 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        ) : (
          <p className="text-sm text-stone-800 whitespace-pre-wrap">
            {entry.draftText || <em className="text-stone-400">No text yet.</em>}
          </p>
        )}
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          {entry.media.map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={m.id}
              src={`/api/files/${m.path}`}
              alt={m.caption || "Photo"}
              className="h-20 w-20 object-cover rounded border border-stone-200"
            />
          ))}
        </div>
        <label className="inline-block mt-2 text-xs text-purple-900 cursor-pointer hover:underline">
          + Add photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addPhoto(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

function TranscriptFallback({ onSave }: { onSave: (transcript: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="No OPENAI_API_KEY configured — type what was said here instead."
        className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
      />
      <button
        onClick={() => onSave(value)}
        disabled={!value.trim()}
        className="rounded bg-stone-700 text-white text-xs px-3 py-1 disabled:opacity-50"
      >
        Save transcript
      </button>
    </div>
  );
}
