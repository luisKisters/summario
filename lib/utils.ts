import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NormalizedTranscriptLine, RawTranscriptItem } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Transcript parsing utilities

function formatSecondsToHms(totalSeconds: number): string {
  const clamped =
    Number.isFinite(totalSeconds) && totalSeconds >= 0 ? totalSeconds : 0;
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = Math.floor(clamped % 60);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function normalizeTranscript(
  transcript: RawTranscriptItem[]
): NormalizedTranscriptLine[] {
  if (!Array.isArray(transcript)) return [];

  return transcript
    .filter((item) => typeof item?.transcript === "string")
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
    .map((item) => {
      const speakerRaw = item.speaker;
      const speakerLabel =
        typeof speakerRaw === "number"
          ? `Speaker ${speakerRaw}`
          : typeof speakerRaw === "string" && speakerRaw.trim().length > 0
          ? speakerRaw.trim()
          : "Speaker";
      const speakerName =
        typeof item.speaker_name === "string" &&
        item.speaker_name.trim().length > 0
          ? item.speaker_name.trim()
          : "Unidentified speaker";

      return {
        speaker: speakerLabel,
        speaker_name: speakerName,
        timestamp: formatSecondsToHms(item.start ?? 0),
        text: item.transcript.trim(),
      };
    });
}

export function formatTranscriptForDisplay(
  transcript: RawTranscriptItem[]
): string[] {
  const normalized = normalizeTranscript(transcript);
  return normalized.map(
    (line) =>
      `${line.timestamp} | ${line.speaker} (${line.speaker_name}): ${line.text}`
  );
}
