"use client";

import { Tables } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Meeting = Tables<"meetings">;

interface MeetingStatusViewProps {
  meeting: Meeting;
}

export default function MeetingStatusView({ meeting }: MeetingStatusViewProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meeting Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-semibold">Status:</p>
          <p>{meeting.status}</p>
        </div>
        {meeting.status === "FAILED" && meeting.error_message && (
          <div>
            <p className="font-semibold text-destructive">Error:</p>
            <p>{meeting.error_message}</p>
          </div>
        )}
        <div>
          <p className="font-semibold">Agenda:</p>
          <ul className="list-disc pl-5">
            {(
              meeting.agenda_topics as { topic: string; details?: string }[]
            )?.map((item, index) => (
              <li key={index}>{item.topic}</li>
            ))}
          </ul>
        </div>
        <Button onClick={handleRefresh}>Refresh Status</Button>
      </CardContent>
    </Card>
  );
}
