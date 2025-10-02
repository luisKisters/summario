import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { meeting_id } = (await req.json()) as { meeting_id?: string };
    if (!meeting_id) {
      return NextResponse.json(
        { error: "meeting_id is required" },
        { status: 400 }
      );
    }

    // Authenticated user
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch meeting to check ownership and get skribby_bot_id
    const admin = getAdminClient();
    const { data: meeting, error } = await admin
      .from("meetings")
      .select("meeting_id, user_id, skribby_bot_id, status")
      .eq("meeting_id", meeting_id)
      .single();

    if (error || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    if (meeting.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!meeting.skribby_bot_id) {
      return NextResponse.json(
        { error: "No bot associated with meeting" },
        { status: 400 }
      );
    }

    // Call Skribby stop API
    const url = `https://platform.skribby.io/api/v1/bot/${meeting.skribby_bot_id}/stop`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SKRIBBY_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: `Failed to stop bot: ${text || resp.statusText}` },
        { status: 502 }
      );
    }

    // Optionally set status toward processing; webhook will reconcile final states
    await admin
      .from("meetings")
      .update({ status: "PROCESSING" })
      .eq("meeting_id", meeting_id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("/api/stop-bot error", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
