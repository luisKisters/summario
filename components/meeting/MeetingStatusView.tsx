"use client";

import { Tables } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import MultiStepLoader from "./MultiStepLoader";
import EditableAgenda from "./EditableAgenda";

type Meeting = Tables<"meetings">;

interface MeetingStatusViewProps {
  meeting: Meeting;
  isOwner: boolean;
  onStopBot: () => void;
  canEditAgenda?: boolean;
}

export default function MeetingStatusView({
  meeting,
  isOwner,
  onStopBot,
  canEditAgenda = true,
}: MeetingStatusViewProps) {
  const router = useRouter();

  const isStoppable =
    isOwner &&
    ["SCHEDULED", "JOINING", "RECORDING", "PROCESSING"].includes(
      meeting.status
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <MultiStepLoader
          currentStatus={meeting.status}
          stoppable={isStoppable}
          onStop={onStopBot}
        />

        {meeting.status === "FAILED" && meeting.error_message && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="font-semibold text-red-800 mb-2">Error Occurred:</p>
            <p className="text-red-700 text-sm">{meeting.error_message}</p>
          </div>
        )}
      </div>

      <EditableAgenda meeting={meeting} editable={canEditAgenda} />
    </div>
  );
}
