import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { current_content, edit_instruction } = await request.json();

  if (!current_content || !edit_instruction) {
    return NextResponse.json(
      { error: "Missing current_content or edit_instruction" },
      { status: 400 }
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
    });

    const prompt = `
You are an expert at editing meeting protocols. Your task is to apply the user's edit instruction to the provided markdown content.

**CRITICAL INSTRUCTIONS - READ AND FOLLOW THESE EXACTLY:**

1. **EXTREME PRECISION IN UPDATES - ONLY MODIFY WHAT IS REQUESTED:**
   - **YOU MUST ONLY UPDATE THE SPECIFIC PARTS THAT ARE EXPLICITLY REQUESTED TO BE CHANGED IN THE EDIT INSTRUCTION.**
   - **DO NOT MODIFY, ALTER, OR UPDATE ANY OTHER PARTS OF THE PROTOCOL UNDER ANY CIRCUMSTANCES.**
   - **KEEP ALL EXISTING CONTENT, FORMATTING, AND STRUCTURE EXACTLY AS PROVIDED IN THE CURRENT CONTENT.**
   - **PRESERVE EVERY SINGLE CHARACTER, SPACING, PUNCTUATION, AND FORMATTING FROM THE ORIGINAL CONTENT.**
   - **ONLY MAKE CHANGES TO THE EXACT SECTIONS, WORDS, OR PHRASES MENTIONED IN THE EDIT INSTRUCTION.**

2. **PRESERVE USER'S EXACT TONE AND STYLE:**
   - **MAINTAIN THE EXACT TONE, VOICE, AND WRITING STYLE FROM THE ORIGINAL PROTOCOL CONTENT.**
   - **DO NOT CHANGE THE LEVEL OF FORMALITY, WORD CHOICE, OR EXPRESSIONS USED IN THE ORIGINAL.**
   - **COPY THE EXACT PHRASES, TERMINOLOGY, AND LANGUAGE PATTERNS FROM THE EXISTING CONTENT.**
   - **IF THE ORIGINAL USES SPECIFIC ABBREVIATIONS, ACRONYMS, OR JARGON, PRESERVE THEM EXACTLY.**
   - **PRESERVE THE EXACT SENTENCE STRUCTURE AND PARAGRAPH FORMATTING FROM THE ORIGINAL.**

3. **EDITING RULES:**
   - Apply ONLY the specific changes requested in the edit instruction.
   - Maintain the markdown formatting and structure of the entire document.
   - Do not add or remove content unless specifically instructed in the edit instruction.
   - Do not reorganize or restructure the document unless explicitly requested.
   - Keep all sections, headings, and formatting exactly as they appear in the current content.

Current protocol content:
${current_content}

User's edit instruction: "${edit_instruction}"

Please apply this edit instruction to the protocol content following the critical instructions above.

Return ONLY the updated markdown content, nothing else. Do not include any explanations or additional text.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const updatedContent = response.text?.trim() || "";
    return NextResponse.json({ updated_content: updatedContent });
  } catch (error) {
    console.error("Error applying AI edit:", error);
    return NextResponse.json(
      { error: "Failed to apply AI edit" },
      { status: 500 }
    );
  }
}
