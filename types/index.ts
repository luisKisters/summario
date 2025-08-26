// API Types for Summario

export interface GenerateTemplateRequest {
  example_protocol: string;
  user_instructions?: string;
}

export interface GenerateTemplateResponse {
  ai_generated_prompt: string;
  ai_generated_template: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  example_protocol: string;
  ai_generated_prompt: string;
  ai_generated_template: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  user_id: string;
  skribby_bot_id?: string;
  meeting_url: string;
  agenda_topics: AgendaTopic[];
  status: MeetingStatus;
  raw_transcript?: string;
  structured_protocol?: StructuredProtocol;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AgendaTopic {
  topic: string;
  details?: string;
}

export type MeetingStatus =
  | "INITIALIZED"
  | "SCHEDULED"
  | "RECORDING"
  | "PROCESSING"
  | "SUMMARIZED"
  | "APPROVED"
  | "FAILED";

export interface StructuredProtocol {
  final_protocol_output: string;
  analysis_and_sources: {
    [agendaTopic: string]: {
      generated_markdown: string;
      reasoning: string;
      source_quotes: Array<{
        speaker: string;
        text: string;
      }>;
    };
  };
}
