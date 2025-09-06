import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { GoogleGenAI, Type } from "@google/genai";

interface GenerateSummaryRequest {
  meeting_id: string;
}

interface GenerateSummaryResponse {
  success: boolean;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateSummaryRequest = await request.json();
    const { meeting_id } = body;

    if (!meeting_id) {
      return NextResponse.json(
        { success: false, message: "meeting_id is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Fetch the specific meeting record
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("meeting_id", meeting_id)
      .single();

    if (meetingError || !meeting) {
      console.error("Error fetching meeting:", meetingError);
      return NextResponse.json(
        { success: false, message: "Meeting not found" },
        { status: 404 }
      );
    }

    if (!meeting.raw_transcript || meeting.status != "DONE") {
      return NextResponse.json(
        {
          success: false,
          message: 'Transcript not available or status is not "DONE"',
        },
        { status: 400 }
      );
    }

    // Fetch the associated user record
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("ai_generated_prompt, ai_generated_template, example_protocol")
      .eq("user_id", meeting.user_id)
      .single();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.ai_generated_prompt || !user.ai_generated_template) {
      return NextResponse.json(
        { success: false, message: "User AI configuration not found" },
        { status: 400 }
      );
    }

    // Initialize Google Gemini API client
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
    });

    // Prepare agenda topics for the prompt
    const agendaForPrompt = meeting.agenda_topics;

    // Construct the final, complex prompt for Gemini
    const prompt = `${user.ai_generated_prompt}

Today's date is: ${new Date().toISOString().split("T")[0]}

Here is the full transcript: ${meeting.raw_transcript}

The agenda for this meeting was: ${JSON.stringify(agendaForPrompt)}

Fill out this template: ${user.ai_generated_template}

This is an example of an actual meeting protocoll ${user.example_protocol}

Your response MUST be a single JSON object with two top-level keys:
1. 'final_protocol_output': A single string containing the complete, formatted markdown protocol, filling the agenda topics.
2. 'analysis_and_sources': An array of objects. Each object must have three keys: 'topic' (the exact agenda topic string from the provided list), 'agendaId' (the corresponding ID for that agenda topic), and 'analysis' (an object containing 'reasoning' (why that summary was concluded), and 'source_quotes' (an array of { speaker: string, text: string } from the transcript)).`;

    // Make the API call to Gemini with structured output
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            final_protocol_output: {
              type: Type.STRING,
            },
            analysis_and_sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: {
                    type: Type.STRING,
                  },
                  agendaId: {
                    type: Type.STRING,
                  },
                  analysis: {
                    type: Type.OBJECT,
                    properties: {
                      reasoning: {
                        type: Type.STRING,
                      },
                      source_quotes: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            speaker: {
                              type: Type.STRING,
                            },
                            text: {
                              type: Type.STRING,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("No response text received from Gemini");
    }

    // Parse the Gemini JSON response
    let structuredProtocol;
    try {
      structuredProtocol = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      throw new Error("Failed to parse AI response");
    }

    // Update the meeting record with the structured protocol
    const { error: updateError } = await supabase
      .from("meetings")
      .update({
        structured_protocol: structuredProtocol,
        status: "SUMMARIZED",
      })
      .eq("meeting_id", meeting_id);

    if (updateError) {
      console.error("Error updating meeting:", updateError);
      throw new Error("Failed to update meeting with protocol");
    }

    const responseData: GenerateSummaryResponse = {
      success: true,
      message: "Protocol generated successfully",
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error in generate-summary API:", error);

    // Try to update meeting status to FAILED if we have a meeting_id
    try {
      const body = await request.json().catch(() => ({}));
      const { meeting_id } = body as GenerateSummaryRequest;

      if (meeting_id) {
        const supabase = getAdminClient();
        await supabase
          .from("meetings")
          .update({
            status: "FAILED",
            error_message:
              error instanceof Error ? error.message : "Unknown error",
          })
          .eq("meeting_id", meeting_id);
      }
    } catch (updateError) {
      console.error("Failed to update meeting status to FAILED:", updateError);
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
