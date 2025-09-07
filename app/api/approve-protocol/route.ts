import { getAdminClient } from "@/lib/supabase/admin";
import { Json } from "@/types/database.types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { meeting_id, approved_content } = await request.json();

  if (!meeting_id || approved_content === undefined) {
    return NextResponse.json(
      { error: "Missing meeting_id or approved_content" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getAdminClient();

  // First, fetch the existing structured_protocol
  const { data: meetingData, error: fetchError } = await supabaseAdmin
    .from("meetings")
    .select("structured_protocol")
    .eq("meeting_id", meeting_id)
    .single();

  if (fetchError || !meetingData) {
    return NextResponse.json(
      { error: "Meeting not found or could not be fetched." },
      { status: 404 }
    );
  }

  // Prepare the updated structured_protocol in a type-safe way
  const existingProtocol = meetingData.structured_protocol;
  const updatedStructuredProtocol: Json = {
    ...(typeof existingProtocol === 'object' && existingProtocol !== null && !Array.isArray(existingProtocol) ? existingProtocol : {}),
    final_protocol_output: approved_content,
  };

  // Now, update the meeting record
  const { error: updateError } = await supabaseAdmin
    .from("meetings")
    .update({
      status: "APPROVED",
      structured_protocol: updatedStructuredProtocol,
    })
    .eq("meeting_id", meeting_id);

  if (updateError) {
    return NextResponse.json(
      { error: `Supabase update error: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
