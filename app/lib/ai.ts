import fs from "node:fs";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export function hasTranscription() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function hasNarrativeDrafting() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Transcribes an audio file. Returns null if no OPENAI_API_KEY is configured
 * (the caller should fall back to leaving the transcript for manual entry).
 */
export async function transcribeAudio(absolutePath: string): Promise<string | null> {
  if (!hasTranscription()) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const file = fs.createReadStream(absolutePath);
  const result = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });
  return result.text;
}

/**
 * Turns a raw answer (typed, or transcribed from audio) into polished
 * first-person narrative prose for the given chapter. Returns null if no
 * ANTHROPIC_API_KEY is configured (caller should fall back to the raw text).
 */
export async function draftNarrative(params: {
  chapterTitle: string;
  questionText?: string | null;
  rawText: string;
}): Promise<string | null> {
  if (!hasNarrativeDrafting()) return null;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { chapterTitle, questionText, rawText } = params;

  const prompt = `You are helping someone turn a raw spoken or typed answer into a short, warm, first-person memoir passage for their autobiography.

Chapter: "${chapterTitle}"
${questionText ? `Prompt they were answering: "${questionText}"` : ""}

Raw answer (transcript or notes, may be messy, repetitive, or have filler words):
"""
${rawText}
"""

Rewrite this as clean, natural first-person narrative prose suitable for a memoir chapter. Keep every fact, name, date and detail exactly as given — do not invent anything, do not add events or feelings that weren't stated. Just clean up grammar, remove filler words and repetition, and smooth it into readable prose. Keep it close to the original length. Return only the rewritten passage, no preamble.`;

  const message = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  return block && block.type === "text" ? block.text.trim() : null;
}
