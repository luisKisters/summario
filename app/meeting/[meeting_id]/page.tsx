"use client";

import { createClient } from "@/lib/supabase/client";
import ApprovedMinutesView from "@/components/meeting/ApprovedMinutesView";
import MeetingStatusView from "@/components/meeting/MeetingStatusView";
import ReviewMinutesView from "@/components/meeting/ReviewMinutesView";
import { Button } from "@/components/ui/button";
import SharePopover from "@/components/meeting/SharePopover";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Tables, Enums } from "@/types/database.types";

type Meeting = Tables<"meetings">;
type AccessLevel = Enums<"meeting_access_level">;

export default function SummaryPage({
  params,
}: {
  params: Promise<{ meeting_id: string }>;
}) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Initialize meeting ID from params
  useEffect(() => {
    params.then(({ meeting_id }) => {
      setMeetingId(meeting_id);
    });
  }, [params]);

  // Fetch meeting data
  const fetchMeeting = async (showRefreshing = false) => {
    if (!meetingId) return;

    if (showRefreshing) {
      setIsRefreshing(true);
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("meetings")
        .select("*, meeting_name")
        .eq("meeting_id", meetingId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setMeeting(data);
        if (user && data.user_id === user.id) {
          setIsOwner(true);
        }
        setError(null);
      }
    } catch (err) {
      setError("Failed to fetch meeting data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (meetingId) {
      fetchMeeting();
    }
  }, [meetingId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!meetingId) return;

    const interval = setInterval(() => {
      fetchMeeting();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [meetingId]);

  // Manual refresh
  const handleRefresh = () => {
    fetchMeeting(true);
  };

  const handleAccessLevelChange = async (accessLevel: AccessLevel) => {
    if (!meeting) return;

    const response = await fetch("/api/update-meeting-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meeting_id: meeting.meeting_id,
        access_level: accessLevel,
      }),
    });

    if (!response.ok) {
      // Handle error, maybe show a toast
      console.error("Failed to update access level: ", response.statusText);
      // Re-fetch to get the old state back
      fetchMeeting();
    } else {
      // Optimistically update the state
      setMeeting((prev) =>
        prev ? { ...prev, access_level: accessLevel } : null
      );
    }
  };

  const handleStopBot = async () => {
    if (!meeting) return;

    try {
      const response = await fetch("/api/stop-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meeting_id: meeting.meeting_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to stop the bot.");
      } else {
        // Re-fetch to update the status
        fetchMeeting();
      }
    } catch (err) {
      setError("An unexpected error occurred while stopping the bot.");
    }
  };

  if (loading) {
    return (
      <div className="py-10">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading meeting data...
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="py-10">
        <div className="text-center">
          <p className="text-destructive mb-4">
            Error: {error || "Meeting not found"}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (meeting.status) {
      case "SUMMARIZED":
        return <ReviewMinutesView meeting={meeting} />;
      case "APPROVED":
        return <ApprovedMinutesView meeting={meeting} />;
      default:
        return (
          <MeetingStatusView
            meeting={meeting}
            isOwner={isOwner}
            onStopBot={handleStopBot}
          />
        );
    }
  };

  return (
    <div className="py-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{meeting.meeting_name}</h1>
          {meeting && (
            <SharePopover
              meeting={meeting}
              onAccessLevelChange={handleAccessLevelChange}
              isOwner={isOwner}
            />
          )}
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        Auto-refreshes every 30 seconds • Last updated:{" "}
        {new Date().toLocaleTimeString()}
      </div>
      {renderView()}
    </div>
  );
}
