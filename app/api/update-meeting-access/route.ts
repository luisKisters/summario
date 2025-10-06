import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { meeting_id, access_level } = await req.json();

  if (!meeting_id || !access_level) {
    return NextResponse.json(
      { error: "Missing meeting_id or access_level" },
      { status: 400 }
    );
  }

  // Check if the user is the owner of the meeting
  const { data: meeting, error: fetchError } = await supabase
    .from("meetings")
    .select("user_id")
    .eq("meeting_id", meeting_id)
    .single();

  if (fetchError || !meeting) {
    return NextResponse.json(
      { error: "Meeting not found or you don't have permission" },
      { status: 404 }
    );
  }

  if (meeting.user_id !== user.id) {
    return NextResponse.json(
      { error: "You are not the owner of this meeting" },
      { status: 403 }
    );
  }

  const { error: updateError } = await supabase
    .from("meetings")
    .update({ access_level })
    .eq("meeting_id", meeting_id);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to update access level: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Access level updated successfully",
  });
}
