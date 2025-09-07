import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types for the API request and response
interface CreateMeetingRequest {
  meeting_name: string;
  meeting_url: string;
  agenda_topics: Array<{ topic: string; details?: string }>;
  start_time_option: "now" | "scheduled";
  scheduled_start_datetime?: string; // ISO 8601 format
}

// Helper function to determine service from meeting URL
function determineService(meetingUrl: string): "gmeet" | "teams" | "zoom" {
  const url = meetingUrl.toLowerCase();
  if (url.includes("meet.google.com") || url.includes("gmeet")) {
    return "gmeet";
  } else if (url.includes("teams.microsoft.com") || url.includes("teams")) {
    return "teams";
  } else if (url.includes("zoom.us") || url.includes("zoom")) {
    return "zoom";
  }
  // Default to gmeet if we can't determine
  return "gmeet";
}

// Helper function to convert ISO datetime to Unix timestamp
function convertISOtoUnix(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000);
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateMeetingRequest = await request.json();
    const {
      meeting_name,
      meeting_url,
      agenda_topics,
      start_time_option,
      scheduled_start_datetime,
    } = body;

    // Validate required fields
    if (
      !meeting_name ||
      !meeting_url ||
      !agenda_topics ||
      !start_time_option
    ) {
      return NextResponse.json(
        {
          error:
            "meeting_name, meeting_url, agenda_topics, and start_time_option are required",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(agenda_topics) || agenda_topics.length === 0) {
      return NextResponse.json(
        { error: "agenda_topics must be a non-empty array" },
        { status: 400 }
      );
    }

    if (start_time_option === "scheduled" && !scheduled_start_datetime) {
      return NextResponse.json(
        {
          error:
            "scheduled_start_datetime is required when start_time_option is 'scheduled'",
        },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine the service from the meeting URL
    const service = determineService(meeting_url);

    // Construct the base request payload for the Skribby API
    const skribbyPayload: any = {
      //   transcription_model: "deepgram", // Default to Deepgram for diarization for V1
      transcription_model: "whisper",
      service: service,
      meeting_url: meeting_url,
      bot_name: "Summario Bot",
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/meeting-callback`,
      //   lang: "en", // Default to English for V1
      //   video: false, // Default to false for V1
      //   profanity_filter: false, // Default to false for V1
    };

    // Conditional start time logic
    if (start_time_option === "scheduled" && scheduled_start_datetime) {
      const scheduledUnixTimestamp = convertISOtoUnix(scheduled_start_datetime);
      skribbyPayload.scheduled_start_time = scheduledUnixTimestamp;
    }

    // Make the POST request to the Skribby API
    const skribbyResponse = await fetch(
      "https://platform.skribby.io/api/v1/bot",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SKRIBBY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(skribbyPayload),
      }
    );

    if (!skribbyResponse.ok) {
      const errorData = await skribbyResponse.json().catch(() => ({}));
      console.error("Skribby API error:", errorData);
      return NextResponse.json(
        {
          error: `Failed to create Skribby bot: ${
            errorData.message || skribbyResponse.statusText
          }`,
        },
        { status: 500 }
      );
    }

    const skribbyBot = await skribbyResponse.json();
    const skribbyBotId = skribbyBot.id;

    const agendaTopicsWithIds = agenda_topics.map((topic, index) => ({
      ...topic,
      id: index.toString(),
    }));

    // Insert a new row into the 'public.meetings' table in Supabase
    const { data: meeting, error: insertError } = await supabase
      .from("meetings")
      .insert({
        user_id: user.id,
        skribby_bot_id: skribbyBotId,
        meeting_name: meeting_name,
        meeting_url: meeting_url,
        agenda_topics: agendaTopicsWithIds,
        status: start_time_option === "scheduled" ? "SCHEDULED" : "INITIALIZED",
        scheduled_start_datetime:
          start_time_option === "scheduled" ? scheduled_start_datetime : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save meeting to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, meeting_id: meeting.meeting_id });
  } catch (error) {
    console.error("Error in create-meeting API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
