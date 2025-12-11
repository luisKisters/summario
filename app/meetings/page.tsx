import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link as LinkIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function MeetingsPage() {
  // Mock data for stats
  const stats = [
    {
      label: "Time Transcribed",
      subLabel: "Last 30 days",
      value: "3h 36min",
      total: "/10h",
    },
    {
      label: "Meetings Summarized",
      subLabel: "Last 30 days",
      value: "3 Meetings",
      total: "",
    },
    {
      label: "Time Saved",
      subLabel: "Last 30 days",
      value: "~1h 30min",
      total: "",
      info: true,
    },
    {
      label: "Summaries awaiting approval",
      subLabel: "Overall",
      value: "1/3 Meetings",
      total: "",
      link: true,
    },
  ];

  // Mock data for meetings
  const meetings = [
    {
      id: 1,
      name: "Donnerstagsmeeting",
      date: "30/11/2025",
      time: "14:00",
      duration: "1h 35min",
      status: "Recording",
      statusColor: "text-green-400 border-green-400/30 bg-green-400/10",
    },
    {
      id: 2,
      name: "Donnerstagsmeeting",
      date: "16/11/2025",
      time: "14:00",
      duration: "1h 35min",
      status: "Summarized",
      statusColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    },
    // Adding more mock data to fill the list
    {
      id: 3,
      name: "Product Design Review",
      date: "10/11/2025",
      time: "10:00",
      duration: "45min",
      status: "Processing",
      statusColor: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1
            className="text-4xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Meetings
          </h1>
          <Link href="/meeting-setup">
            <Button size="lg" className="rounded-full px-6">
              Add Meeting
            </Button>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="overflow-hidden border border-white/10 bg-card"
            >
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {stat.label}
                    {stat.info && (
                      <span
                        className="inline-block w-4 h-4 rounded-full border border-muted-foreground/50 text-[10px] flex items-center justify-center cursor-help"
                        title="Estimated time saved based on average reading speed"
                      >
                        i
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    {stat.subLabel}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </span>
                    {stat.total && (
                      <span className="text-sm text-muted-foreground">
                        {stat.total}
                      </span>
                    )}
                  </div>
                  {stat.link && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <Card
              key={meeting.id}
              className="group overflow-hidden bg-card border border-white/10"
            >
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Meeting Info */}
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-foreground">
                    {meeting.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{meeting.date}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                    <span>{meeting.time}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                    <span>{meeting.duration}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                  <div
                    className={`px-4 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2 ${meeting.statusColor}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                    {meeting.status}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-transparent border-white/10 hover:bg-white/5 hover:border-primary/30"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="sr-only">Copy Link</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
