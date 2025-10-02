"use client";

import { Tables } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import MultiStepLoader from "./MultiStepLoader";
import EditableAgenda from "./EditableAgenda";

type Meeting = Tables<"meetings">;

interface MeetingStatusViewProps {
  meeting: Meeting;
}

export default function MeetingStatusView({ meeting }: MeetingStatusViewProps) {
  const router = useRouter();

  // Removed Edit Setup: bots cannot be edited after creation

  const isStoppable = [
    "SCHEDULED",
    "JOINING",
    "RECORDING",
    "PROCESSING",
  ].includes(meeting.status);

  const handleStopBot = async () => {
    try {
      const res = await fetch("/api/stop-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: meeting.meeting_id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to stop bot");
      }
    } catch (e) {
      // Non-blocking; could add a toast here
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <MultiStepLoader
          currentStatus={meeting.status}
          stoppable={isStoppable}
          onStop={handleStopBot}
        />

        {/* Stop button now appears in MultiStepLoader under current step when applicable */}

        {meeting.status === "FAILED" && meeting.error_message && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="font-semibold text-red-800 mb-2">Error Occurred:</p>
            <p className="text-red-700 text-sm">{meeting.error_message}</p>
          </div>
        )}
      </div>

      <EditableAgenda meeting={meeting} />
    </div>
  );
}
