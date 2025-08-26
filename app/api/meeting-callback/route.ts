import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Minimal typing for Skribby webhook payload based on Bot schema
interface SkribbyWebhookPayload {
  // New schema
  bot_id?: string;
  type?: string; // e.g., "status_update"
  data?: { old_status?: string; new_status?: string };
}

function mapSkribbyStatusToMeetingStatus(
  status: string | undefined
):
  | "JOINING"
  | "RECORDING"
  | "PROCESSING"
  | "SUMMARIZED"
  | "FAILED"
  | undefined {
  if (!status) return undefined;
  const normalized = status.toLowerCase();
  if (normalized === "joining") return "JOINING";
  if (normalized === "recording") return "RECORDING";
  if (normalized === "processing" || normalized === "transcribing")
    return "PROCESSING";
  if (normalized === "finished") return "SUMMARIZED"; // We will trigger generation and eventually become SUMMARIZED
  if (
    normalized === "failed" ||
    normalized === "not_admitted" ||
    normalized === "auth_required" ||
    normalized === "invalid_credentials"
  )
    return "FAILED";
  return undefined;
}

export async function POST(request: NextRequest) {
  // Always acknowledge quickly per PRD
  try {
    const payload = (await request.json()) as SkribbyWebhookPayload;
    console.log("Skribby Callback Payload: ", payload);
    const skribbyBotId = payload?.bot_id;

    if (!skribbyBotId) {
      // Acknowledge but note invalid payload
      return NextResponse.json(
        { status: "received", note: "missing id" },
        { status: 200 }
      );
    }

    const supabase = await createClient();

    // Find meeting by skribby_bot_id
    const { data: meeting, error: findError } = await supabase
      .from("meetings")
      .select("id, status")
      .eq("skribby_bot_id", skribbyBotId)
      .single();

    if (findError || !meeting) {
      return NextResponse.json(
        { status: "received", note: "meeting not found" },
        { status: 200 }
      );
    }

    const newStatusRaw = payload?.data?.new_status;
    const mappedStatus = mapSkribbyStatusToMeetingStatus(newStatusRaw);

    // Build update object
    const update: Record<string, unknown> = {};
    if (mappedStatus && mappedStatus !== "SUMMARIZED") {
      // Do not mark as SUMMARIZED here; generation will do that
      update.status = mappedStatus;
    }

    // TODO: Add error handling
    // // On failure-like statuses, store error message if present
    // if (mappedStatus === "FAILED" && payload.message) {
    //   update.error_message = payload.message;
    // }

    if (Object.keys(update).length > 0) {
      await supabase.from("meetings").update(update).eq("id", meeting.id);
    }

    // Fire-and-forget summary generation after persisting transcript
    if ((newStatusRaw || "").toLowerCase() === "finished") {
      try {
        // Do not await to keep webhook response snappy
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meeting_id: meeting.id }),
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch {
    // Still acknowledge per PRD
    return NextResponse.json({ status: "received" }, { status: 200 });
  }
}
