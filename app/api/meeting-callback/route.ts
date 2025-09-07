import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { Tables, TablesUpdate } from "@/types/database.types";

// Add message for FAILED status
interface SkribbyWebhookPayload {
  bot_id?: string;
  type?: string; // e.g., "status_update"
  data?: { old_status?: string; new_status?: string };
  message?: string; // For error messages from Skribby
}

function mapSkribbyStatusToMeetingStatus(
  status: string | undefined
): Tables<"meetings">["status"] | undefined {
  if (!status) return undefined;
  const normalized = status.toLowerCase();
  if (normalized === "joining") return "JOINING";
  if (normalized === "recording") return "RECORDING";
  if (normalized === "processing" || normalized === "transcribing")
    return "PROCESSING";
  if (normalized === "finished") return "DONE";
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
      return NextResponse.json(
        { status: "received", note: "missing bot_id" },
        { status: 200 }
      );
    }

    const supabase = getAdminClient();

    const { data: meeting, error: findError } = await supabase
      .from("meetings")
      .select("meeting_id, status")
      .eq("skribby_bot_id", skribbyBotId)
      .single<Pick<Tables<"meetings">, "meeting_id" | "status">>();

    if (findError || !meeting) {
      console.error(
        "Error finding meeting by skribby_bot_id:",
        skribbyBotId,
        findError
      );
      return NextResponse.json(
        {
          status: "received",
          note: "meeting not found or db error",
        },
        { status: 200 }
      );
    }

    const newStatusRaw = payload?.data?.new_status;
    const mappedStatus = mapSkribbyStatusToMeetingStatus(newStatusRaw);

    if (!mappedStatus) {
      console.log(`Ignoring unhandled status: ${newStatusRaw}`);
      return NextResponse.json({
        status: "received",
        note: "unhandled status",
      });
    }

    if (mappedStatus === "DONE") {
      // set_transcript will update status to DONE or FAILED
      await set_transcript(skribbyBotId, meeting.meeting_id);
    } else {
      // For JOINING, RECORDING, PROCESSING, FAILED
      const updateQuery: TablesUpdate<"meetings"> = { status: mappedStatus };

      // On failure-like statuses, store error message if present
      if (mappedStatus === "FAILED" && payload.message) {
        updateQuery.error_message = payload.message;
      }

      const { error: supabaseError } = await supabase
        .from("meetings")
        .update(updateQuery)
        .eq("meeting_id", meeting.meeting_id);

      if (supabaseError) {
        console.error("Error updating meeting status:", supabaseError);
        // Don't return error to Skribby, just log it.
      }
    }

    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (error) {
    console.error("Error processing Skribby callback:", error);
    // Still acknowledge per PRD
    return NextResponse.json(
      { status: "received", note: "internal server error" },
      { status: 200 }
    );
  }
}

async function set_transcript(bot_id: string, meeting_id: string) {
  const supabase = getAdminClient();
  try {
    const skribbyResponse = await fetch(
      `https://platform.skribby.io/api/v1/bot/${bot_id}?with-speaker-events=false`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SKRIBBY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const skribbyBot = await skribbyResponse.json();

    if (!skribbyResponse.ok) {
      throw new Error(skribbyBot.message || skribbyResponse.statusText);
    }

    if (!skribbyBot.transcript || !skribbyBot.participants?.length) {
      throw new Error("Skribby bot transcript or participants not found.");
    }

    const participants = skribbyBot.participants.map(
      (participant: { name: string; avatar: string }) => ({
        name: participant.name,
        avatar: participant.avatar,
      })
    );

    const { error: updateError } = await supabase
      .from("meetings")
      .update({
        raw_transcript: skribbyBot.transcript,
        status: "DONE",
        participants: participants,
      })
      .eq("skribby_bot_id", bot_id);

    if (updateError) {
      throw updateError;
    }

    // If transcript is saved, trigger summary generation
    console.log("Generating summary for meeting:", meeting_id);
    const generateSummaryResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/generate-summary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: meeting_id }),
      }
    );

    if (!generateSummaryResponse.ok) {
      const errorJson = await generateSummaryResponse
        .json()
        .catch(() => ({ message: "Failed to parse error response" }));
      throw new Error(
        `Failed to trigger summary generation: ${
          errorJson.message || "Unknown error"
        }`
      );
    }
  } catch (error) {
    console.error("Error in set_transcript:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error in set_transcript";
    const { error: dbError } = await supabase
      .from("meetings")
      .update({
        status: "FAILED",
        error_message: errorMessage,
      })
      .eq("skribby_bot_id", bot_id);

    if (dbError) {
      console.error("Error updating meeting to FAILED status:", dbError);
    }
  }
}
