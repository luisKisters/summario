import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { Tables, TablesUpdate } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

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

async function throwError(
  message: string,
  status: number,
  supabase: SupabaseClient,
  meeting_id?: string,
  skribbyBotId?: string
) {
  if (skribbyBotId) {
    const { error: updateError } = await supabase
      .from("meetings")
      .select("meeting_id")
      .eq("skribby_bot_id", skribbyBotId)
      .single<Pick<Tables<"meetings">, "meeting_id">>();

    if (updateError) {
      console.error(
        "Error finding meeting by skribby_bot_id for error logging:",
        skribbyBotId,
        updateError
      );
    } else if (meeting_id) {
      const { error: supabaseError } = await supabase
        .from("meetings")
        .update({ status: "FAILED", error_message: message })
        .eq("meeting_id", meeting_id);

      if (supabaseError) {
        console.error("Error updating meeting status:", supabaseError);
      }
    }
  }

  console.error("Error:", message);
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SkribbyWebhookPayload;
    const skribbyBotId = payload?.bot_id;

    if (!skribbyBotId) {
      await throwError("missing bot_id", 400, getAdminClient(), "");
      return;
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
      await throwError("meeting not found or db error", 404, supabase, "");
      return;
    }

    const newStatusRaw = payload?.data?.new_status;
    const mappedStatus = mapSkribbyStatusToMeetingStatus(newStatusRaw);

    if (!mappedStatus) {
      return NextResponse.json({ error: "unhandled status" }, { status: 500 });
    }

    if (mappedStatus === "DONE") {
      await fetchAndSaveTranscript(skribbyBotId, meeting.meeting_id);
    } else {
      const updateQuery: TablesUpdate<"meetings"> = { status: mappedStatus };

      if (mappedStatus === "FAILED" && payload.message) {
        updateQuery.error_message = payload.message; // Log Skribby error message in db
      }

      const { error: supabaseError } = await supabase
        .from("meetings")
        .update(updateQuery)
        .eq("meeting_id", meeting.meeting_id);

      if (supabaseError) {
        console.error("Error updating meeting status:", supabaseError);
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

async function fetchAndSaveTranscript(bot_id: string, meeting_id: string) {
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
      return NextResponse.json(
        {
          error: `Failed to fetch Skribby bot data: ${skribbyResponse.status} ${skribbyResponse.statusText}`,
        },
        { status: 500 }
      );
    }

    if (!skribbyBot.transcript || !skribbyBot.participants?.length) {
      return NextResponse.json(
        { error: "Incomplete data from Skribby" },
        { status: 500 }
      );
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
        // `raw_transcript` is stored as a string in our DB schema.
        // Skribby returns an array of segments, so we persist it as JSON.
        raw_transcript: JSON.stringify(skribbyBot.transcript),
        status: "DONE",
        participants: participants,
      })
      .eq("skribby_bot_id", bot_id);

    if (updateError) {
      return NextResponse.json(
        {
          error: `Failed to update meeting with transcript: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    const summaryUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/generate-summary`;

    const generateSummaryResponse = await fetch(summaryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: meeting_id }),
    });

    if (!generateSummaryResponse.ok) {
      const errorText = await generateSummaryResponse.text();
      let errorMessage = "Unknown error";

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch {
        errorMessage = errorText || `HTTP ${generateSummaryResponse.status}`;
      }

      return;
    }
  } catch (error) {
    console.error("Error in save_and_fetch_transcript:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error in save_and_fetch_transcript";
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
