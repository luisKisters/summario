import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerateTemplateRequest, GenerateTemplateResponse } from "@/types";

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body: GenerateTemplateRequest = await request.json();
    const { example_protocol, user_instructions } = body;

    if (!example_protocol || typeof example_protocol !== "string") {
      return NextResponse.json(
        { error: "example_protocol is required and must be a string" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Construct the meta-prompt for Gemini to act as a prompt engineer
    let metaPrompt = `You are an expert prompt engineer specializing in meeting protocol generation. Your task is to analyze the provided example protocol and create two outputs:

1. A detailed system prompt for generating future protocols
2. A template with placeholders for dynamic content

ANALYZE THE FOLLOWING EXAMPLE PROTOCOL:
${example_protocol}`;

    // Add user instructions if provided
    if (user_instructions && user_instructions.trim()) {
      metaPrompt += `

USER-SPECIFIC INSTRUCTIONS & CONTEXT:
${user_instructions.trim()}

Please incorporate these instructions into your analysis and template generation.`;
    }

    metaPrompt += `

Based on this example, identify and extract:

**Writing Style Analysis:**
- Overall tone (formal, informal, journalistic, report-like)
- Language complexity and vocabulary level
- Sentence structure patterns

**Formatting Rules:**
- How decisions are presented (e.g., bolded, bulleted, in tables)
- How action items are structured (columns, format, details)
- How speaker names are handled (prefixes, formatting)
- Section organization and hierarchy
- Use of markdown elements (tables, lists, headers, emphasis)

**Dynamic Elements:**
- Date and time formatting
- Participant information structure
- Meeting title conventions
- Agenda topic handling
- Any recurring patterns or placeholders

**Content Structure:**
- How different types of information are categorized
- What gets emphasized vs. what's summarized
- How conclusions and next steps are presented

**CRITICAL INSTRUCTIONS FOR TEMPLATE GENERATION:**
- The number of agenda items is NOT fixed - it can vary between meetings
- STRICTLY PRESERVE the exact format and structure of the example protocol
- DO NOT modify, add, or remove any formatting elements (tables, lists, headers, etc.)
- ONLY replace specific data content with placeholders like {{MEETING_TITLE}}, {{DATE}}, {{PARTICIPANTS}}, {{AGENDA_TOPIC_1}}, {{AGENDA_TOPIC_2}}, etc.
- Remove inserted data, inserted topics, inserted participants, etc. and replace with appropriate placeholders
- Keep all markdown formatting, table structures, bullet points, and organizational elements exactly as they appear
- The template should be a direct copy of the example with only data replaced by placeholders

RESPOND WITH ONLY A JSON OBJECT:
{
  "ai_generated_prompt": "A detailed system prompt that instructs an AI how to generate protocols in this exact style and format. Include specific formatting rules, tone requirements, and structural guidelines. Emphasize that the number of agenda items can vary and should be handled dynamically.",
  "ai_generated_template": "A template that is an EXACT copy of the example protocol structure, with only specific data replaced by placeholders (e.g., {{MEETING_TITLE}}, {{DATE}}, {{PARTICIPANTS}}, {{AGENDA_TOPIC_1}}, {{AGENDA_TOPIC_2}}). Preserve ALL formatting, tables, lists, and structure exactly as shown."
}

Ensure the response is valid JSON and contains exactly these two keys.`;

    // Generate content using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(metaPrompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let parsedResponse: Partial<GenerateTemplateResponse>;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.error("Raw response:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (
      !parsedResponse.ai_generated_prompt ||
      !parsedResponse.ai_generated_template
    ) {
      return NextResponse.json(
        { error: "Invalid AI response structure" },
        { status: 500 }
      );
    }

    const responseData: GenerateTemplateResponse = {
      ai_generated_prompt: parsedResponse.ai_generated_prompt,
      ai_generated_template: parsedResponse.ai_generated_template,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error in generate-template API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
