"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { Tables } from "@/types/database.types";
import {
  Plus,
  Link2,
  ArrowRight,
  Info,
  Clock,
  FileText,
  Timer,
  AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";

type Meeting = Tables<"meetings">;

interface MeetingStats {
  totalTranscribedMinutes: number;
  maxTranscribedMinutes: number;
  meetingsSummarized: number;
  estimatedTimeSavedMinutes: number;
  awaitingApproval: number;
  totalMeetings: number;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const statusLower = status.toLowerCase();

  if (statusLower === "approved" || statusLower === "summarized") {
    return { label: "Summarized", variant: "default" as const };
  }
  if (statusLower === "recording" || statusLower === "in_call") {
    return { label: "Recording", variant: "secondary" as const };
  }
  if (statusLower === "transcribing" || statusLower === "processing") {
    return { label: "Processing", variant: "secondary" as const };
  }
  if (statusLower === "pending_review") {
    return { label: "Pending Review", variant: "outline" as const };
  }
  if (statusLower === "error" || statusLower === "failed") {
    return { label: "Error", variant: "destructive" as const };
  }
  return { label: status, variant: "outline" as const };
}

function calculateStats(meetings: Meeting[]): MeetingStats {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentMeetings = meetings.filter(
    (m) => new Date(m.created_at) >= thirtyDaysAgo
  );

  let totalTranscribedMinutes = 0;
  let meetingsSummarized = 0;
  let awaitingApproval = 0;

  recentMeetings.forEach((meeting) => {
    // Estimate duration from transcript length or use a default
    const transcriptLength = meeting.raw_transcript?.length || 0;
    const estimatedMinutes = Math.max(
      30,
      Math.min(180, transcriptLength / 500)
    );
    totalTranscribedMinutes += estimatedMinutes;

    const status = meeting.status?.toLowerCase() || "";
    if (status === "approved" || status === "summarized") {
      meetingsSummarized++;
    }
    if (status === "pending_review") {
      awaitingApproval++;
    }
  });

  // Estimate time saved (roughly 40% of meeting duration for reading summaries vs full transcript)
  const estimatedTimeSavedMinutes = meetingsSummarized * 30;

  return {
    totalTranscribedMinutes: Math.round(totalTranscribedMinutes),
    maxTranscribedMinutes: 600, // 10 hours for the plan
    meetingsSummarized,
    estimatedTimeSavedMinutes,
    awaitingApproval,
    totalMeetings: meetings.length,
  };
}

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  value: string;
  suffix?: string;
  tooltip?: string;
  action?: { href: string };
}

function StatItem({
  icon: Icon,
  label,
  sublabel,
  value,
  suffix,
  tooltip,
  action,
}: StatItemProps) {
  const content = (
    <div className="flex-1 py-4 px-4 first:pl-0 last:pr-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {action && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
      <p className="text-2xl font-semibold mt-2">
        {value}
        {suffix && (
          <span className="text-base font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );

  if (action) {
    return (
      <Link href={action.href} className="flex-1 min-w-0">
        <motion.div
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          transition={{ duration: 0.15 }}
          className="rounded-md -mx-2 px-2"
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  return content;
}

function StatsBar({
  stats,
  meetings,
}: {
  stats: MeetingStats;
  meetings: Meeting[];
}) {
  return (
    <Card>
      <CardContent className="py-2 px-6">
        <div className="flex flex-col md:flex-row md:divide-x divide-border">
          <StatItem
            icon={Clock}
            label="Time Transcribed"
            sublabel="Last 30 days"
            value={formatDuration(stats.totalTranscribedMinutes)}
            suffix={` /${formatDuration(stats.maxTranscribedMinutes)}`}
          />
          <StatItem
            icon={FileText}
            label="Meetings Summarized"
            sublabel="Last 30 days"
            value={`${stats.meetingsSummarized}`}
            suffix=" Meetings"
          />
          <StatItem
            icon={Timer}
            label="Time Saved"
            sublabel="Last 30 days"
            value={`~${formatDuration(stats.estimatedTimeSavedMinutes)}`}
            tooltip="Estimated time saved by reading AI summaries instead of full transcripts"
          />
          <StatItem
            icon={AlertCircle}
            label="Awaiting approval"
            sublabel="Overall"
            value={`${stats.awaitingApproval}/${stats.totalMeetings}`}
            suffix=" Meetings"
            action={
              stats.awaitingApproval > 0
                ? {
                    href: `/meeting/${
                      meetings.find(
                        (m) => m.status?.toLowerCase() === "pending_review"
                      )?.meeting_id || ""
                    }`,
                  }
                : undefined
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const [copied, setCopied] = useState(false);
  const statusInfo = getStatusBadge(meeting.status || "unknown");

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/meeting/${meeting.meeting_id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate approximate duration
  const transcriptLength = meeting.raw_transcript?.length || 0;
  const estimatedMinutes = Math.max(30, Math.min(180, transcriptLength / 500));

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.15 }}
    >
      <Link href={`/meeting/${meeting.meeting_id}`}>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">
                {meeting.meeting_name || "Untitled Meeting"}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatDate(meeting.created_at)} |{" "}
                {formatTime(meeting.created_at)} |{" "}
                {formatDuration(estimatedMinutes)}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      className="h-8 w-8"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied ? "Copied!" : "Copy link"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchMeetings() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching meetings:", error);
        setError("Error loading meetings.");
      } else {
        setMeetings(data || []);
      }
      setLoading(false);
    }

    fetchMeetings();
  }, [router]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-28 bg-muted rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <Card className="border-destructive">
          <CardContent className="py-6 flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = calculateStats(meetings);

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
        <Link href="/meeting-setup">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Meeting
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <StatsBar stats={stats} meetings={meetings} />

      {/* Meeting List */}
      {meetings.length > 0 ? (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingRow key={meeting.meeting_id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold">No Meetings Yet</h2>
            <p className="text-muted-foreground mt-2">
              Get started by creating your first meeting.
            </p>
            <Link href="/meeting-setup">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Meeting
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
