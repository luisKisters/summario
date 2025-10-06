"use client";

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// User-facing steps for live meeting status
const STEPS = [
  { key: "Scheduled", label: "Scheduled" },
  { key: "Starting", label: "Starting" },
  { key: "Joining", label: "Joining" },
  { key: "Recording", label: "Recording" },
  { key: "Done", label: "Done" },
  { key: "Summarizing", label: "Summarizing" },
  { key: "Failed", label: "Failed" },
];

// Map database statuses to user-facing steps
const STATUS_MAPPING: Record<string, (typeof STEPS)[number]["key"]> = {
  SCHEDULED: "Scheduled",
  INITIALIZED: "Starting",
  JOINING: "Joining",
  RECORDING: "Recording",
  DONE: "Done",
  PROCESSING: "Summarizing",
  SUMMARIZED: "Summarizing",
  APPROVED: "Summarizing",
  FAILED: "Failed",
};

interface MultiStepLoaderProps {
  currentStatus: string;
  className?: string;
  stoppable?: boolean;
  onStop?: () => void;
}

export default function MultiStepLoader({
  currentStatus,
  className,
  stoppable = false,
  onStop,
}: MultiStepLoaderProps) {
  const mappedStatus =
    STATUS_MAPPING[currentStatus as keyof typeof STATUS_MAPPING] || "Scheduled";
  const currentStepIndex = STEPS.findIndex((step) => step.key === mappedStatus);
  const isFailedOverall = mappedStatus === "Failed";
  const isScheduledOnly = mappedStatus === "Scheduled";

  const handleStop = async () => {
    try {
      await onStop?.();
    } catch (error: any) {
      // Check if this is the specific validation error about bot state
      if (
        error?.message?.includes(
          "Meeting bot is not joining or recording state"
        )
      ) {
        toast.error(
          "Cannot stop the bot at this time. The bot must be joining or recording to be stopped."
        );
      } else {
        toast.error("Failed to stop the bot. Please try again.");
      }
      console.error("Error stopping bot:", error);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <ol className="space-y-4">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          // Special rule: when status is exactly SCHEDULED, mark Scheduled step as completed (checked)
          const isCompleted =
            !isFailedOverall &&
            (index < currentStepIndex ||
              (isScheduledOnly && step.key === "Scheduled"));
          const isFailedCurrent = isCurrent && isFailedOverall;
          return (
            <li key={step.key} className="flex items-start gap-3">
              {/* Circular indicator */}
              <div className="mt-0.5 h-6 w-6 flex items-center justify-center">
                {isFailedCurrent ? (
                  <div className="h-6 w-6 rounded-full bg-destructive flex items-center justify-center">
                    <X className="h-3.5 w-3.5 text-white" />
                  </div>
                ) : isCompleted ? (
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-card border border-border" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={cn(
                      "text-sm font-medium",
                      isFailedCurrent && "text-destructive",
                      isCompleted && !isFailedCurrent && "text-foreground",
                      !isCompleted && !isFailedCurrent && "text-foreground"
                    )}
                  >
                    {step.label}
                  </h4>
                  {isCurrent && !isFailedCurrent && (
                    <span className="text-xs text-muted-foreground">
                      Current
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    isFailedCurrent
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {getStepHelpText(step.key)}
                </p>

                {/* Stop button under current step, only when stoppable */}
                {isCurrent && stoppable && !isFailedCurrent && onStop && (
                  <div className="mt-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleStop}
                    >
                      Stop Bot
                    </Button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function getStepHelpText(step: (typeof STEPS)[number]["key"]) {
  switch (step) {
    case "Scheduled":
      return "Meeting is scheduled and ready to start.";
    case "Starting":
      return "Preparing to join the meeting.";
    case "Joining":
      return "Bot is joining the call.";
    case "Recording":
      return "Recording and transcribing in progress.";
    case "Done":
      return "Recording finished.";
    case "Summarizing":
      return "Generating minutes from the transcript.";
    case "Failed":
      return "The bot encountered an error and stopped.";
    default:
      return "";
  }
}
