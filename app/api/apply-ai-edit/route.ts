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

Current protocol content:
${current_content}

User's edit instruction: "${edit_instruction}"

Please apply this edit instruction to the protocol content. Maintain the markdown formatting and structure. Only make the requested changes - do not add or remove content unless specifically instructed.

Return ONLY the updated markdown content, nothing else. Do not include any explanations or additional text.
`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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
