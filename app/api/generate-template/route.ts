import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { GenerateTemplateRequest, GenerateTemplateResponse } from "@/types";

// Initialize Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

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
    let metaPrompt = `You are a world-class prompt engineering system. Your mission is to deconstruct a user-provided example of a meeting protocol and generate a high-fidelity, reusable AI configuration (a system prompt and a template) from it. This configuration will be used by another AI to generate future protocols in the exact same style.

  ---
  **INPUT PROTOCOL EXAMPLE:**
  ${example_protocol}
  ---`;

    // Add user instructions if provided
    if (user_instructions && user_instructions.trim()) {
      metaPrompt += `
  ---
  **ADDITIONAL USER INSTRUCTIONS:**
  ${user_instructions.trim()}
  ---`;
    }

    metaPrompt += `

  Your task is to follow this two-step process meticulously:

  **Step 1: Deep Analysis**
  First, perform a deep analysis of the provided example. Internally, identify the following patterns:
  -   **Tone & Style:** Is it formal, informal, technical, decisive? What is the vocabulary and sentence structure? The language of the final prompt must match the language of this example.
  -   **Data Extraction:** Identify all dynamic data points (e.g., meeting title, date, list of participants).
  -   **Structural Formatting:** Deconstruct the exact markdown structure. Note the use of headers, tables, bold/italic emphasis, blockquotes, and lists. Pay special attention to how action items and decisions are formatted.
  -   **Repeating Elements:** Identify elements that appear in a list, such as participants and agenda points. This is crucial for the template.

  **Step 2: Generate the Configuration**
  Using your analysis, you will construct the two required outputs.

  **Output 1: \`ai_generated_prompt\` - The System Prompt**
  This is not just a summary of the style; it is a direct, actionable set of instructions for another AI. It must be comprehensive and clear.
  -   **Persona:** It must start by giving the next AI a clear persona (e.g., "You are an expert executive assistant...").
  -   **Goal:** It must state the primary goal (e.g., "...your task is to convert a raw meeting transcript into a structured protocol...").
  -   **Key Rules:** It must include a "Key Rules" section with specific, bullet-pointed instructions derived from your analysis. Examples:
      -   "The tone must be formal and concise."
      -   "All decisions must be prefixed with 'DECISION:' and rendered in bold."
  -   **Handling Variable Items (CRITICAL):** The prompt MUST include a rule explaining how to handle a variable number of agenda items with the fixed number of placeholders in the template. For example: "The template provides a fixed number of placeholders (e.g., AGENDA_TOPIC_1, AGENDA_TOPIC_2). Fill these sequentially. If you are given fewer items than placeholders, you MUST omit the unused placeholder sections entirely from the final output. If you are given more items, you MUST replicate the formatting of the last placeholder for each additional item."

  **Output 2: \`ai_generated_template\` - The Structural Template**
  This is the most critical part. The template must be a **structurally identical replica** of the example protocol, with only the specific data values replaced by placeholders.
  -   **Placeholder Convention:**
      -   For single values, use \`{{PLACEHOLDER_NAME}}\` (e.g., \`{{MEETING_TITLE}}\`, \`{{DATE}}\`).
      -   For lists of items (like participants or agenda topics), generate **exactly three** numbered placeholders to establish the pattern (e.g., \`{{AGENDA_TOPIC_1}}\`, \`{{AGENDA_TOPIC_2}}\`, \`{{AGENDA_TOPIC_3}}\`). This ensures the AI understands the repeatable structure.
  -   **Absolute Preservation:** You MUST preserve ALL markdown formatting, including headers, tables, lists, whitespace, and any static text or punctuation. DO NOT add, remove, or alter the structure. The template should be a direct copy of the example with only the specific data replaced by these placeholders.

  ---
  **FINAL OUTPUT INSTRUCTIONS:**
  Respond with **ONLY a valid JSON object** containing exactly two keys: "ai_generated_prompt" and "ai_generated_template". Do not include any other text, explanations, or markdown formatting around the JSON.

  **EXAMPLE OF A PERFECT RESPONSE:**
  \`\`\`json
  {
    "ai_generated_prompt": "You are a professional meeting secretary. Your sole task is to accurately populate the provided template with information extracted from a meeting transcript. The final output must be a single, complete markdown document.\\n\\n**Key Rules:**\\n- The tone must be formal and direct.\\n- All key decisions must be rendered in **bold**.\\n- **Handling Agenda Items:** The template provides placeholders for 3 agenda topics. You must fill these sequentially based on the topics provided to you. If you receive fewer than 3 topics, you must delete the unused sections (e.g., if you only have 2 topics, the entire section for AGENDA_TOPIC_3 should be removed from the final output). If you receive more than 3 topics, you must repeat the exact markdown structure of the AGENDA_TOPIC_3 section for all additional topics.",
    "ai_generated_template": "# Meeting Protocol: {{MEETING_TITLE}}\\n\\n**Date:** {{DATE}}\\n\\n**Participants:**\\n- {{PARTICIPANT_1}}\\n- {{PARTICIPANT_2}}\\n- {{PARTICIPANT_3}}\\n\\n---\\n\\n## {{AGENDA_TOPIC_1.TITLE}}\\n\\n**Summary:**\\n{{AGENDA_TOPIC_1.SUMMARY}}\\n\\n---\\n\\n## {{AGENDA_TOPIC_2.TITLE}}\\n\\n**Summary:**\\n{{AGENDA_TOPIC_2.SUMMARY}}\\n\\n---\\n\\n## {{AGENDA_TOPIC_3.TITLE}}\\n\\n**Summary:**\\n{{AGENDA_TOPIC_3.SUMMARY}}"
  }
  \`\`\`
  `;
    // Generate content using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: metaPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ai_generated_prompt: {
              type: Type.STRING,
            },
            ai_generated_template: {
              type: Type.STRING,
            },
          },
        },
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("No response text received from Gemini");
    }

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
