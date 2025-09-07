"use client";

import { createClient } from "@/lib/supabase/client";
import ApprovedProtocolView from "@/components/meeting/ApprovedProtocolView";
import MeetingStatusView from "@/components/meeting/MeetingStatusView";
import ReviewProtocolView from "@/components/meeting/ReviewProtocolView";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Tables } from "@/types/database.types";

type Meeting = Tables<"meetings">;

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
      const { data, error } = await supabase
        .from("meetings")
        .select("*, meeting_name")
        .eq("meeting_id", meetingId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setMeeting(data);
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

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading meeting data...
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="container mx-auto py-10">
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
        return <ReviewProtocolView meeting={meeting} />;
      case "APPROVED":
        return <ApprovedProtocolView meeting={meeting} />;
      default:
        return <MeetingStatusView meeting={meeting} />;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{meeting.meeting_name}</h1>
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
