"use client";

import { createClient } from "@/lib/supabase/client";
import ApprovedMinutesView from "@/components/meeting/ApprovedMinutesView";
import MeetingStatusView from "@/components/meeting/MeetingStatusView";
import ReviewMinutesView from "@/components/meeting/ReviewMinutesView";
import { Button } from "@/components/ui/button";
import SharePopover from "@/components/meeting/SharePopover";
import { RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Tables, Enums } from "@/types/database.types";
import AccessDenied from "@/components/meeting/AccessDenied";
import NotFound from "./not-found";

type Meeting = Tables<"meetings">;
type AccessLevel = Enums<"meeting_access_level">;
type UserRole = "OWNER" | "EDITOR" | "COLLABORATOR" | "VIEWER" | "NONE";

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
  const [userRole, setUserRole] = useState<UserRole>("NONE");

  useEffect(() => {
    params.then(({ meeting_id }) => {
      setMeetingId(meeting_id);
    });
  }, [params]);

  const fetchMeeting = useCallback(
    async (showRefreshing = false) => {
      if (!meetingId) return;

      if (showRefreshing) {
        setIsRefreshing(true);
      }

      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("Auth user:", user);

      let { data, error: meetingError } = await supabase
        .from("meetings")
        .select("*")
        .eq("meeting_id", meetingId)
        .single();

      if (meetingError) {
        // Check if the meeting exists at all using the public existence view
        const { data: existenceData, error: existenceError } = await (
          supabase as any
        )
          .from("meetings_public_exists")
          .select("meeting_id")
          .eq("meeting_id", meetingId)
          .single();

        if (existenceError) {
          // Meeting does not exist - 404
          setError("404");
        } else {
          // Meeting exists but user has no access - Access Denied
          setError("ACCESS_DENIED");
        }
        setMeeting(null);
        setLoading(false);
        if (showRefreshing) {
          setIsRefreshing(false);
        }
        return;
      }

      if (data) {
        setMeeting(data);
        setError(null);

        // Determine user role
        if (user && data.user_id === user.id) {
          console.log("Setting role to OWNER", {
            userId: user.id,
            meetingUserId: data.user_id,
          });
          setUserRole("OWNER");
        } else if (data.access_level === "PRIVATE") {
          // Private meetings require authentication
          if (!user) {
            setUserRole("NONE");
            setError("ACCESS_DENIED");
            setMeeting(null);
            return;
          }
          setUserRole("NONE"); // Should not reach here due to RLS, but fallback
        } else if (data.access_level) {
          // Public meetings - assign role based on access level
          switch (data.access_level) {
            case "EDITOR":
              setUserRole("EDITOR");
              break;
            case "COLLABORATOR":
              setUserRole("COLLABORATOR");
              break;
            case "VIEWER":
              setUserRole("VIEWER");
              break;
            default:
              setUserRole("VIEWER"); // Default to viewer for any other case
          }
        } else {
          setUserRole("VIEWER"); // Fallback for meetings without access_level
        }
      }

      setLoading(false);
      if (showRefreshing) {
        setIsRefreshing(false);
      }
    },
    [meetingId]
  );

  useEffect(() => {
    if (meetingId) {
      fetchMeeting();
    }
  }, [meetingId, fetchMeeting]);

  useEffect(() => {
    if (!meetingId) return;

    const interval = setInterval(() => {
      fetchMeeting();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [meetingId, fetchMeeting]);

  const handleRefresh = () => {
    fetchMeeting(true);
  };

  const handleAccessLevelChange = async (accessLevel: AccessLevel) => {
    if (!meeting || userRole !== "OWNER") return;

    const originalAccessLevel = meeting.access_level;
    setMeeting((prev) =>
      prev ? { ...prev, access_level: accessLevel } : null
    );

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
      console.error("Failed to update access level:", response.statusText);
      setMeeting((prev) =>
        prev ? { ...prev, access_level: originalAccessLevel } : null
      );
    }
  };

  const handleStopBot = async () => {
    if (!meeting || userRole !== "OWNER") return;

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

  if (error === "404") {
    return <NotFound />;
  }

  if (error === "ACCESS_DENIED" || !meeting) {
    return <AccessDenied />;
  }

  // Additional check for unauthorized access
  if (userRole === "NONE") {
    return <AccessDenied />;
  }

  const canEditMinutes = userRole === "OWNER" || userRole === "EDITOR";
  const canEditAgenda = canEditMinutes || userRole === "COLLABORATOR";

  console.log("Main Page Debug:", {
    userRole,
    canEditMinutes,
    canEditAgenda,
    meetingStatus: meeting?.status,
  });

  const renderView = () => {
    switch (meeting.status) {
      case "SUMMARIZED":
        return (
          <ReviewMinutesView meeting={meeting} isEditable={canEditMinutes} />
        );
      case "APPROVED":
        return <ApprovedMinutesView meeting={meeting} />;
      default:
        return (
          <MeetingStatusView
            meeting={meeting}
            isOwner={userRole === "OWNER"}
            onStopBot={handleStopBot}
            canEditAgenda={canEditAgenda}
          />
        );
    }
  };

  return (
    <div className="py-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{meeting.meeting_name}</h1>
          <SharePopover
            meeting={meeting}
            onAccessLevelChange={handleAccessLevelChange}
            isOwner={userRole === "OWNER"}
          />
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
