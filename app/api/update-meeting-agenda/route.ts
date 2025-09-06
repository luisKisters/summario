import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


interface UpdateAgendaRequest {
  meeting_id: string;
  agenda_topics: Array<{ id?: string; topic: string; details?: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateAgendaRequest = await request.json();
    const { meeting_id, agenda_topics } = body;

    if (!meeting_id || !agenda_topics) {
      return NextResponse.json(
        { error: "meeting_id and agenda_topics are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(agenda_topics)) {
      return NextResponse.json(
        { error: "agenda_topics must be an array" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user owns the meeting
    const { data: existingMeeting, error: selectError } = await supabase
      .from("meetings")
      .select("user_id")
      .eq("meeting_id", meeting_id)
      .single();

    if (selectError || !existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (existingMeeting.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const agendaTopicsWithIds = agenda_topics.map((topic, index) => ({
      ...topic,
      id: topic.id || index.toString(),
    }));

    // Update the agenda_topics
    const { error: updateError } = await supabase
      .from("meetings")
      .update({ agenda_topics: agendaTopicsWithIds })
      .eq("meeting_id", meeting_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update meeting agenda" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in update-meeting-agenda API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
