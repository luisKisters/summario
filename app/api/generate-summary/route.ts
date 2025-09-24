import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { GoogleGenAI, Type } from "@google/genai";
import { Tables } from "@/types/database.types";
import { formatTranscriptForDisplay } from "../../../lib/utils";

interface GenerateSummaryRequest {
	meeting_id: string;
}

const SYSTEM_PROMPT = `
You are an expert AI assistant specialized in generating professional meeting minutes from transcripts. Your task is to analyze meeting transcripts and create structured, accurate minutes that match the user's preferred style and format.

**CRITICAL INSTRUCTIONS:**

1. **Handling Variable Agenda Items:**
   The template may provide a fixed number of placeholders (e.g., AGENDA_TOPIC_1, AGENDA_TOPIC_2). Fill these sequentially with the provided agenda topics. 
   - If you are given fewer agenda items than placeholders, you MUST omit the unused placeholder sections entirely from the final output.
   - If you are given more agenda items than placeholders, you MUST replicate the formatting of the last placeholder for each additional item, maintaining the same structure and style.

2. **Table Formatting with Dot Points:**
   If the user's template includes tables that contain dot points or bullet points within table cells, you MUST use HTML <br> tags for line breaks instead of markdown line breaks. This ensures proper rendering in markdown tables.

3. **Participants Handling:**
   - If the minutes template includes a participants section, you MUST list ALL participants provided in the participants data.
   - Match names from the transcript to the correct participant names provided. For example, if the transcript has "louis" but the participants list has "Luis", use "Luis" in the minutes.
   - Exclude any bots or automated speakers from the participants list.
   - Only include human participants who were actually present in the meeting.

4. **Minutes Generation Rules:**
   - Strictly follow the user's example minutes style and formatting.
   - Use the provided template as the foundation, filling in all placeholders appropriately.
   - Ensure the final output is professional, clear, and comprehensive.
   - Base all content on the actual transcript - do not add information that isn't supported by the conversation.
   - Maintain the exact formatting and structure shown in the user's example minutes.

5. **Output Structure:**
   Your response MUST be a valid JSON object with exactly two top-level keys:
   - 'final_protocol_output': A single string containing the complete, formatted markdown minutes
   - 'analysis_and_sources': An array of objects, one for each agenda topic, containing the topic, agendaId, and detailed analysis with reasoning and source quotes
`;

export async function POST(request: NextRequest) {
	let meeting_id: string | undefined;

	try {
		const body: GenerateSummaryRequest = await request.json();
		meeting_id = body.meeting_id;

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
			.single<Tables<"meetings">>();

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
			.single<
				Pick<
					Tables<"users">,
					"ai_generated_prompt" | "ai_generated_template" | "example_protocol"
				>
			>();

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

		const transcript_parsed = meeting.enable_diarization
			? formatTranscriptForDisplay(
					JSON.parse(meeting.raw_transcript || "[]")
			  ).join("\n")
			: meeting.raw_transcript;

		// Format participants for better AI processing
		const participants = Array.isArray(meeting.participants)
			? meeting.participants
			: JSON.parse(
					typeof meeting.participants === "string" ? meeting.participants : "[]"
			  );

		const participantNames = participants
			.filter((p: any) => p.name && !p.name.toLowerCase().includes("bot"))
			.map((p: any) => p.name)
			.join(", ");

		// Construct the final, complex prompt for Gemini
		const prompt = `
${SYSTEM_PROMPT}

**USER-SPECIFIC CONFIGURATION:**
${user.ai_generated_prompt}

**CURRENT DATE:** ${new Date().toISOString().split("T")[0]}

**MEETING TRANSCRIPT:**
${transcript_parsed}

**AGENDA TOPICS:**
${JSON.stringify(agendaForPrompt)}

**MEETING NAME:**
${meeting.meeting_name}}

**TEMPLATE TO FILL:**
${user.ai_generated_template}

**MEETING PARTICIPANTS:**
${participantNames}

**USER'S EXAMPLE MINUTES:**
${user.example_protocol}
`;

		console.log("PROMPTT: ", prompt);

		// Make the API call to Gemini with structured output
		const response = await ai.models.generateContent({
			model: "gemini-2.5-proo",
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

		// Update the meeting record with the structured minutes
		const { error: updateError } = await supabase
			.from("meetings")
			.update({
				structured_protocol: structuredProtocol,
				status: "SUMMARIZED",
			})
			.eq("meeting_id", meeting_id);

		if (updateError) {
			console.error("Error updating meeting:", updateError);
			throw new Error("Failed to update meeting with minutes");
		}

		return NextResponse.json({
			success: true,
			message: "Minutes generated successfully",
		});
	} catch (error) {
		console.error("Error in generate-summary API:", error);

		// Try to update meeting status to FAILED if we have a meeting_id
		if (meeting_id) {
			try {
				const supabase = getAdminClient();
				await supabase
					.from("meetings")
					.update({
						status: "FAILED",
						error_message:
							error instanceof Error ? error.message : "Unknown error",
					})
					.eq("meeting_id", meeting_id);
			} catch (updateError) {
				console.error(
					"Failed to update meeting status to FAILED:",
					updateError
				);
			}
		}

		return NextResponse.json(
			{ success: false, message: "Internal server error" },
			{ status: 500 }
		);
	}
}
