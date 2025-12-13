"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Search,
  CalendarIcon,
  X,
  LayoutList,
  LayoutGrid,
  Check,
  CircleAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

type Meeting = Tables<"meetings">;
type ViewMode = "list" | "cards";

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

type StatusType =
  | "summarized"
  | "recording"
  | "processing"
  | "pending_review"
  | "error"
  | "done"
  | "scheduled"
  | "unknown";

function getStatusInfo(status: string): {
  label: string;
  type: StatusType;
  borderColor: string;
} {
  const statusLower = status.toLowerCase();

  if (statusLower === "approved" || statusLower === "summarized") {
    return {
      label: "Summarized",
      type: "summarized",
      borderColor: "border-primary",
    };
  }
  if (statusLower === "done") {
    return {
      label: "Done",
      type: "done",
      borderColor: "border-muted-foreground",
    };
  }
  if (statusLower === "recording" || statusLower === "in_call") {
    return {
      label: "Recording",
      type: "recording",
      borderColor: "border-blue-500",
    };
  }
  if (statusLower === "transcribing" || statusLower === "processing") {
    return {
      label: "Processing",
      type: "processing",
      borderColor: "border-yellow-500",
    };
  }
  if (statusLower === "pending_review") {
    return {
      label: "Pending Review",
      type: "pending_review",
      borderColor: "border-orange-500",
    };
  }
  if (statusLower === "scheduled") {
    return {
      label: "Scheduled",
      type: "scheduled",
      borderColor: "border-muted-foreground",
    };
  }
  if (statusLower === "error" || statusLower === "failed") {
    return {
      label: "Error",
      type: "error",
      borderColor: "border-destructive",
    };
  }
  return {
    label: status || "Unknown",
    type: "unknown",
    borderColor: "border-muted-foreground",
  };
}

function StatusBadge({ status }: { status: string }) {
  const info = getStatusInfo(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium text-secondary-foreground",
        info.borderColor
      )}
    >
      {info.label}
    </span>
  );
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

  const estimatedTimeSavedMinutes = meetingsSummarized * 30;

  return {
    totalTranscribedMinutes: Math.round(totalTranscribedMinutes),
    maxTranscribedMinutes: 600,
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
    <div className="flex-1 py-4 px-6 flex justify-center">
      <div className="text-left">
        <div className="flex items-center justify-end gap-2 text-muted-foreground text-sm">
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
          {action && <ArrowRight className="h-3.5 w-3.5" />}
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
    </div>
  );

  if (action) {
    return (
      <Link
        href={action.href}
        className="flex-1 hover:bg-muted/50 transition-colors"
      >
        {content}
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
      <CardContent className="p-0">
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

function FilterBar({
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  viewMode,
  setViewMode,
  showPendingOnly,
  setShowPendingOnly,
  pendingCount,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (value: DateRange | undefined) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  showPendingOnly: boolean;
  setShowPendingOnly: (value: boolean) => void;
  pendingCount: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meetings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Requires Approval Quick Filter */}
      <Button
        variant={showPendingOnly ? "default" : "outline"}
        size="sm"
        onClick={() => setShowPendingOnly(!showPendingOnly)}
        className="shrink-0 gap-2"
      >
        <CircleAlert className="h-4 w-4" />
        Requires Approval
        {pendingCount > 0 && (
          <span
            className={cn(
              "ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
              showPendingOnly
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-orange-500/10 text-orange-500"
            )}
          >
            {pendingCount}
          </span>
        )}
      </Button>

      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal min-w-[200px]",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Filter by date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Clear Date Range Button */}
      {dateRange && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDateRange(undefined)}
          className="shrink-0 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* View Mode Toggle */}
      <div className="flex border rounded-md">
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setViewMode("list")}
          className="rounded-r-none h-8 w-8"
        >
          <LayoutList className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "cards" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setViewMode("cards")}
          className="rounded-l-none h-8 w-8"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CopyLinkButton({ meetingId }: { meetingId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/meeting/${meetingId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 800);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileTap={{ scale: 0.9 }} transition={{ duration: 0.1 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? "Copied!" : "Copy link"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const transcriptLength = meeting.raw_transcript?.length || 0;
  const estimatedMinutes = Math.max(30, Math.min(180, transcriptLength / 500));

  return (
    <Link href={`/meeting/${meeting.meeting_id}`} className="block">
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="py-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">
              {meeting.meeting_name || "Untitled Meeting"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(meeting.created_at)} |{" "}
              {formatTime(meeting.created_at)} |{" "}
              {formatDuration(estimatedMinutes)}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusBadge status={meeting.status || "unknown"} />
            <CopyLinkButton meetingId={meeting.meeting_id} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const transcriptLength = meeting.raw_transcript?.length || 0;
  const estimatedMinutes = Math.max(30, Math.min(180, transcriptLength / 500));

  return (
    <Link href={`/meeting/${meeting.meeting_id}`} className="block h-full">
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3">
            <StatusBadge status={meeting.status || "unknown"} />
            <CopyLinkButton meetingId={meeting.meeting_id} />
          </div>
          <div className="mt-4 flex-1">
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
              {meeting.meeting_name || "Untitled Meeting"}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {formatDate(meeting.created_at)} ·{" "}
              {formatTime(meeting.created_at)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDuration(estimatedMinutes)}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showPendingOnly, setShowPendingOnly] = useState(false);
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

  const pendingCount = useMemo(() => {
    return meetings.filter((m) => m.status?.toLowerCase() === "pending_review")
      .length;
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (meeting.meeting_name || "").toLowerCase();
        const url = (meeting.meeting_url || "").toLowerCase();
        if (!name.includes(query) && !url.includes(query)) {
          return false;
        }
      }

      // Pending approval filter
      if (showPendingOnly) {
        if (meeting.status?.toLowerCase() !== "pending_review") {
          return false;
        }
      }

      // Date range filter
      if (dateRange?.from) {
        const meetingDate = new Date(meeting.created_at);
        if (meetingDate < dateRange.from) {
          return false;
        }
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (meetingDate > endOfDay) {
            return false;
          }
        }
      }

      return true;
    });
  }, [meetings, searchQuery, dateRange, showPendingOnly]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-28 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg" />
          <div className="space-y-4">
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

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateRange={dateRange}
        setDateRange={setDateRange}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showPendingOnly={showPendingOnly}
        setShowPendingOnly={setShowPendingOnly}
        pendingCount={pendingCount}
      />

      {/* Meeting List/Grid */}
      {filteredMeetings.length > 0 ? (
        viewMode === "list" ? (
          <div className="flex flex-col gap-4">
            {filteredMeetings.map((meeting) => (
              <MeetingRow key={meeting.meeting_id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMeetings.map((meeting) => (
              <MeetingCard key={meeting.meeting_id} meeting={meeting} />
            ))}
          </div>
        )
      ) : meetings.length > 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No meetings found</h2>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or filters.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setDateRange(undefined);
                setShowPendingOnly(false);
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
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
