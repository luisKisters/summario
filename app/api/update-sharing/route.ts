import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/update-sharing
 * Updates the sharing permissions for a meeting
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { meeting_id, is_public } = body;

    if (!meeting_id || typeof is_public !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: meeting_id and is_public" },
        { status: 400 }
      );
    }

    // Verify the user owns this meeting
    const { data: meeting, error: fetchError } = await supabase
      .from("meetings")
      .select("user_id")
      .eq("meeting_id", meeting_id)
      .single();

    if (fetchError || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to modify this meeting" },
        { status: 403 }
      );
    }

    // Update the share_permissions column
    const { data: updatedMeeting, error: updateError } = await supabase
      .from("meetings")
      .update({
        share_permissions: is_public ? "PUBLIC" : null,
      })
      .eq("meeting_id", meeting_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating sharing permissions:", updateError);
      return NextResponse.json(
        { error: "Failed to update sharing permissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      share_permissions: updatedMeeting.share_permissions,
    });
  } catch (error) {
    console.error("Error in update-sharing API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
