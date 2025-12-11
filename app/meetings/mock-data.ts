export interface MockMeeting {
  id: string;
  name: string;
  date: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED" | "CLASSIFIED";
  duration: string;
  participants: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sector: string;
}

export const mockMeetings: MockMeeting[] = [
  {
    id: "M-7829-ALPHA",
    name: "Operation: Nightfall Debrief",
    date: "2025-10-15T09:00:00Z",
    status: "COMPLETED",
    duration: "45m",
    participants: ["Agent K", "Director Fury", "Analyst J"],
    priority: "HIGH",
    sector: "SECTOR 7",
  },
  {
    id: "M-9921-BRAVO",
    name: "Project Gemini: Initial Scope",
    date: "2025-10-14T14:30:00Z",
    status: "ACTIVE",
    duration: "1h 15m",
    participants: ["Dr. Vance", "Lead Eng. Chen"],
    priority: "CRITICAL",
    sector: "R&D WING",
  },
  {
    id: "M-1102-CHARLIE",
    name: "Weekly Intel Sync",
    date: "2025-10-12T10:00:00Z",
    status: "ARCHIVED",
    duration: "30m",
    participants: ["Team Alpha"],
    priority: "LOW",
    sector: "COMMAND",
  },
  {
    id: "M-4451-DELTA",
    name: "Anomaly Detected: Sector 4",
    date: "2025-10-10T23:15:00Z",
    status: "CLASSIFIED",
    duration: "??",
    participants: ["REDACTED"],
    priority: "CRITICAL",
    sector: "UNK",
  },
  {
    id: "M-3321-ECHO",
    name: "Budget Review Q4",
    date: "2025-10-08T11:00:00Z",
    status: "COMPLETED",
    duration: "2h",
    participants: ["Finance Dept", "Oversight Comm"],
    priority: "MEDIUM",
    sector: "ADMIN",
  },
  {
    id: "M-6672-FOXTROT",
    name: "Protocol Update v2.1",
    date: "2025-10-05T09:30:00Z",
    status: "ARCHIVED",
    duration: "15m",
    participants: ["All Personnel"],
    priority: "LOW",
    sector: "GLOBAL",
  },
];
