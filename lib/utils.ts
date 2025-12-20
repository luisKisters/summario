import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PotentialSpeakerName = {
  name: string;
  confidence: number; // [0..1]
};

type SkribbyTranscriptSegment = {
  start?: number;
  end?: number;
  speaker?: number;
  speaker_name?: string | null;
  potential_speaker_names?: PotentialSpeakerName[] | null;
  transcript?: string;
  confidence?: number;
};

function formatSecondsToTimestamp(seconds: number | undefined): string {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) {
    return "";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function pickBestSpeakerName(segment: SkribbyTranscriptSegment): {
  name: string;
  confidence?: number;
} {
  const explicit = segment.speaker_name?.trim();
  if (explicit) return { name: explicit };

  const potentials = Array.isArray(segment.potential_speaker_names)
    ? segment.potential_speaker_names
    : [];
  if (potentials.length > 0) {
    const best = potentials.reduce((acc, cur) =>
      cur.confidence > acc.confidence ? cur : acc
    );
    return {
      name: best.name,
      confidence: best.confidence,
    };
  }

  if (typeof segment.speaker === "number") {
    return { name: `Speaker ${segment.speaker}` };
  }

  return { name: "Unknown" };
}

/**
 * Formats a diarized transcript into human-readable lines.
 *
 * Important: Skribby now returns either `speaker_name` (confident match) OR
 * `potential_speaker_names` (uncertain match list). We always choose the most
 * probable speaker, and when we had to choose from potentials we append the confidence.
 */
export function formatTranscriptForDisplay(input: unknown): string[] {
  let transcript: unknown = input;

  if (typeof transcript === "string") {
    try {
      transcript = JSON.parse(transcript);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(transcript)) return [];

  return (transcript as SkribbyTranscriptSegment[])
    .map((segment) => {
      const text = (segment.transcript ?? "").trim();
      if (!text) return null;

      const { name, confidence } = pickBestSpeakerName(segment);
      const tsStart = formatSecondsToTimestamp(segment.start);
      const tsEnd = formatSecondsToTimestamp(segment.end);
      const ts =
        tsStart && tsEnd
          ? `[${tsStart}-${tsEnd}] `
          : tsStart
          ? `[${tsStart}] `
          : "";

      const speakerLabel =
        typeof confidence === "number"
          ? `${name} (${Math.round(confidence * 100)}%)`
          : name;

      return `${ts}${speakerLabel}: ${text}`;
    })
    .filter((line): line is string => Boolean(line));
}
