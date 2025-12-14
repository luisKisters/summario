"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Tables } from "@/types/database.types";
import {
  Plus,
  Link2,
  CalendarIcon,
  LayoutList,
  LayoutGrid,
  Check,
  CircleAlert,
  ChevronDown,
  ListFilter,
  SlidersHorizontal,
  AlertCircle,
  Clock,
  FileText,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

type Meeting = Tables<"meetings">;
type ViewMode = "list" | "cards";
type TemplateFilter = "all" | string;

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
}

// Placeholder templates for future implementation
const TEMPLATE_OPTIONS = [
  { id: "all", label: "All meetings", icon: "📋" },
  { id: "standup", label: "Standup", icon: "🏃" },
  { id: "planning", label: "Planning", icon: "📅" },
  { id: "retrospective", label: "Retrospective", icon: "🔄" },
  { id: "one-on-one", label: "1:1", icon: "👥" },
];

// Usage limits (in minutes) - adjust based on plan
const MONTHLY_LIMIT_MINUTES = 600; // 10 hours

interface UsageStats {
  usedMinutes: number;
  limitMinutes: number;
  meetingsSummarized: number;
  timeSavedMinutes: number;
}

function calculateUsageStats(meetings: Meeting[]): UsageStats {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentMeetings = meetings.filter(
    (m) => new Date(m.created_at) >= thirtyDaysAgo
  );

  let usedMinutes = 0;
  let meetingsSummarized = 0;

  recentMeetings.forEach((meeting) => {
    const transcriptLength = meeting.raw_transcript?.length || 0;
    // Estimate ~500 chars per minute of transcript
    const estimatedMinutes = Math.max(5, Math.min(180, transcriptLength / 500));
    usedMinutes += estimatedMinutes;

    const status = meeting.status?.toLowerCase() || "";
    if (status === "approved" || status === "summarized") {
      meetingsSummarized++;
    }
  });

  // Estimate 30min saved per summarized meeting (reading summary vs full transcript)
  const timeSavedMinutes = meetingsSummarized * 30;

  return {
    usedMinutes: Math.round(usedMinutes),
    limitMinutes: MONTHLY_LIMIT_MINUTES,
    meetingsSummarized,
    timeSavedMinutes,
  };
}

function UsageStatsBar({ meetings }: { meetings: Meeting[] }) {
  const stats = calculateUsageStats(meetings);
  const usagePercentage = Math.min(
    100,
    (stats.usedMinutes / stats.limitMinutes) * 100
  );
  const remainingMinutes = Math.max(0, stats.limitMinutes - stats.usedMinutes);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMins = remainingMinutes % 60;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          {/* Usage Progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Monthly Usage</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDuration(stats.usedMinutes)} /{" "}
                {formatDuration(stats.limitMinutes)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usagePercentage >= 90
                    ? "bg-destructive"
                    : usagePercentage >= 70
                    ? "bg-orange-500"
                    : "bg-primary"
                )}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {remainingHours > 0 || remainingMins > 0 ? (
                <>
                  <span className="text-foreground font-medium">
                    {remainingHours}h {remainingMins}min
                  </span>{" "}
                  remaining this month
                </>
              ) : (
                <span className="text-destructive">Monthly limit reached</span>
              )}
            </p>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-12 bg-border" />

          {/* Stats */}
          <div className="flex gap-6 sm:gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-xs">Summarized</span>
              </div>
              <p className="text-xl font-semibold">
                {stats.meetingsSummarized}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-xs">Time Saved</span>
              </div>
              <p className="text-xl font-semibold">
                ~{formatDuration(stats.timeSavedMinutes)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
  | "approved"
  | "recording"
  | "processing"
  | "pending_review"
  | "error"
  | "starting"
  | "scheduled"
  | "unknown";

interface StatusInfo {
  label: string;
  type: StatusType;
  className: string;
  showRecordingDot?: boolean;
}

function getStatusInfo(status: string): StatusInfo {
  const statusLower = status.toLowerCase();

  if (statusLower === "approved" || statusLower === "done") {
    return {
      label: "Done",
      type: "approved",
      className: "bg-green-500/15 text-green-600 dark:text-green-400",
    };
  }
  if (statusLower === "recording" || statusLower === "in_call") {
    return {
      label: "Recording",
      type: "recording",
      className: "bg-secondary text-secondary-foreground",
      showRecordingDot: true,
    };
  }
  if (statusLower === "starting" || statusLower === "booting") {
    return {
      label: "Starting",
      type: "starting",
      className: "bg-secondary text-secondary-foreground",
    };
  }
  if (statusLower === "transcribing" || statusLower === "processing") {
    return {
      label: "Processing",
      type: "processing",
      className: "bg-secondary text-secondary-foreground",
    };
  }
  if (
    statusLower === "pending_review" ||
    statusLower === "summarized" ||
    statusLower === "awaiting_approval"
  ) {
    return {
      label: "Requires Approval",
      type: "pending_review",
      className: "bg-secondary text-secondary-foreground",
    };
  }
  if (statusLower === "scheduled") {
    return {
      label: "Scheduled",
      type: "scheduled",
      className: "bg-secondary text-secondary-foreground",
    };
  }
  if (statusLower === "error" || statusLower === "failed") {
    return {
      label: "Error",
      type: "error",
      className: "bg-destructive/15 text-destructive",
    };
  }
  return {
    label: status || "Unknown",
    type: "unknown",
    className: "bg-secondary text-secondary-foreground",
  };
}

function StatusBadge({ status }: { status: string }) {
  const info = getStatusInfo(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        info.className
      )}
    >
      {info.showRecordingDot && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
      {info.label}
    </span>
  );
}

// Date grouping helpers
type DateGroup = "today" | "yesterday" | "thisWeek" | "thisMonth" | "older";

function getDateGroup(dateString: string): DateGroup {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  if (date >= today) return "today";
  if (date >= yesterday) return "yesterday";
  if (date >= weekAgo) return "thisWeek";
  if (date >= monthAgo) return "thisMonth";
  return "older";
}

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  thisMonth: "This Month",
  older: "Older",
};

function groupMeetingsByDate(
  meetings: Meeting[]
): { group: DateGroup; meetings: Meeting[] }[] {
  const groups: Record<DateGroup, Meeting[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  meetings.forEach((meeting) => {
    const group = getDateGroup(meeting.created_at);
    groups[group].push(meeting);
  });

  const orderedGroups: DateGroup[] = [
    "today",
    "yesterday",
    "thisWeek",
    "thisMonth",
    "older",
  ];

  return orderedGroups
    .filter((group) => groups[group].length > 0)
    .map((group) => ({ group, meetings: groups[group] }));
}

function DatabaseHeader({
  templateFilter,
  setTemplateFilter,
  dateRange,
  setDateRange,
  viewMode,
  setViewMode,
  showPendingOnly,
  setShowPendingOnly,
  pendingCount,
}: {
  templateFilter: TemplateFilter;
  setTemplateFilter: (value: TemplateFilter) => void;
  dateRange: DateRange | undefined;
  setDateRange: (value: DateRange | undefined) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  showPendingOnly: boolean;
  setShowPendingOnly: (value: boolean) => void;
  pendingCount: number;
}) {
  const selectedTemplate =
    TEMPLATE_OPTIONS.find((t) => t.id === templateFilter) ||
    TEMPLATE_OPTIONS[0];

  return (
    <div className="space-y-4">
      {/* Title Row */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
      </div>

      {/* Toolbar Row */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        {/* Left Side - Template Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 px-3 py-1.5 h-auto text-sm font-medium hover:bg-muted/50 rounded-full"
            >
              <ListFilter className="h-4 w-4" />
              {selectedTemplate.label}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {TEMPLATE_OPTIONS.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => setTemplateFilter(template.id)}
                className="gap-2 cursor-pointer"
              >
                <span>{template.icon}</span>
                <span>{template.label}</span>
                {templateFilter === template.id && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right Side - Filters and Actions */}
        <div className="flex items-center gap-1.5">
          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  dateRange && "bg-muted text-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Date Range</span>
                  {dateRange && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange(undefined)}
                      className="h-auto py-1 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
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

          {/* View Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === "list" ? "cards" : "list")}
            className="h-8 w-8"
          >
            {viewMode === "list" ? (
              <LayoutList className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>

          {/* Requires Approval Filter */}
          <Button
            variant={showPendingOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPendingOnly(!showPendingOnly)}
            className="h-8 gap-1.5"
          >
            <CircleAlert className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Approval</span>
            {pendingCount > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium min-w-[18px]",
                  showPendingOnly
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-orange-500 text-white"
                )}
              >
                {pendingCount}
              </span>
            )}
          </Button>

          {/* Separator */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* New Meeting Button with Template Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8">
                <Plus className="h-4 w-4" />
                New
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/meeting-setup" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Blank meeting</span>
                </Link>
              </DropdownMenuItem>
              {TEMPLATE_OPTIONS.filter((t) => t.id !== "all").map(
                (template) => (
                  <DropdownMenuItem
                    key={template.id}
                    asChild
                    className="cursor-pointer"
                  >
                    <Link
                      href={`/meeting-setup?template=${template.id}`}
                      className="gap-2"
                    >
                      <span>{template.icon}</span>
                      <span>{template.label}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
  const statusInfo = getStatusInfo(meeting.status || "unknown");
  const needsReview = statusInfo.type === "pending_review";

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
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={meeting.status || "unknown"} />
            {needsReview && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                Review
              </Button>
            )}
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
  const statusInfo = getStatusInfo(meeting.status || "unknown");
  const needsReview = statusInfo.type === "pending_review";

  return (
    <Link href={`/meeting/${meeting.meeting_id}`} className="block h-full">
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3">
            <StatusBadge status={meeting.status || "unknown"} />
            <div className="flex items-center gap-2">
              {needsReview && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  Review
                </Button>
              )}
              <CopyLinkButton meetingId={meeting.meeting_id} />
            </div>
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
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>("all");
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
      // Template filter (placeholder - meetings don't have template field yet)
      // When template field is added, filter here based on templateFilter

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
  }, [meetings, templateFilter, dateRange, showPendingOnly]);

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

  return (
    <div className="py-8 space-y-6">
      {/* Database Header */}
      <DatabaseHeader
        templateFilter={templateFilter}
        setTemplateFilter={setTemplateFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showPendingOnly={showPendingOnly}
        setShowPendingOnly={setShowPendingOnly}
        pendingCount={pendingCount}
      />

      {/* Usage Stats */}
      <UsageStatsBar meetings={meetings} />

      {/* Meeting List/Grid */}
      {filteredMeetings.length > 0 ? (
        <div className="space-y-6">
          {groupMeetingsByDate(filteredMeetings).map(
            ({ group, meetings: groupMeetings }) => (
              <div key={group}>
                {/* Date Group Header */}
                <h2 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-2">
                  {DATE_GROUP_LABELS[group]}
                </h2>
                {viewMode === "list" ? (
                  <div className="flex flex-col gap-3">
                    {groupMeetings.map((meeting) => (
                      <MeetingRow key={meeting.meeting_id} meeting={meeting} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupMeetings.map((meeting) => (
                      <MeetingCard key={meeting.meeting_id} meeting={meeting} />
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      ) : meetings.length > 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <SlidersHorizontal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No meetings found</h2>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setTemplateFilter("all");
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
