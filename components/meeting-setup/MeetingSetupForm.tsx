"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AgendaTopic } from "@/types";
import { CalendarIcon, Plus, X, Clock } from "lucide-react";
import { format } from "date-fns";

export function MeetingSetupForm() {
  const router = useRouter();

  // Form state
  const [meetingUrl, setMeetingUrl] = useState("");
  const [agendaTopics, setAgendaTopics] = useState<AgendaTopic[]>([
    { topic: "", details: "" },
  ]);
  const [joinTimeOption, setJoinTimeOption] = useState<"now" | "scheduled">(
    "now"
  );
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Add new agenda topic
  const addAgendaTopic = () => {
    setAgendaTopics([...agendaTopics, { topic: "", details: "" }]);
  };

  // Remove agenda topic
  const removeAgendaTopic = (index: number) => {
    if (agendaTopics.length > 1) {
      setAgendaTopics(agendaTopics.filter((_, i) => i !== index));
    }
  };

  // Update agenda topic
  const updateAgendaTopic = (
    index: number,
    field: keyof AgendaTopic,
    value: string
  ) => {
    const updatedTopics = [...agendaTopics];
    updatedTopics[index] = { ...updatedTopics[index], [field]: value };
    setAgendaTopics(updatedTopics);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate form
      if (!meetingUrl.trim()) {
        throw new Error("Meeting URL is required");
      }

      if (!agendaTopics.some((topic) => topic.topic.trim())) {
        throw new Error("At least one agenda topic is required");
      }

      if (joinTimeOption === "scheduled" && (!selectedDate || !selectedTime)) {
        throw new Error("Date and time are required for scheduled meetings");
      }

      // Filter out empty agenda topics
      const validAgendaTopics = agendaTopics.filter((topic) =>
        topic.topic.trim()
      );

      // Prepare request body
      const requestBody: any = {
        meeting_url: meetingUrl.trim(),
        agenda_topics: validAgendaTopics,
        start_time_option: joinTimeOption,
      };

      if (joinTimeOption === "scheduled" && selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(":");
        const scheduledDateTime = new Date(selectedDate);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        requestBody.scheduled_start_datetime = scheduledDateTime.toISOString();
      }

      // Make API call
      const response = await fetch("/api/create-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create meeting");
      }

      const data = await response.json();

      // Redirect to meeting summary page
      router.push(`/summary/${data.meeting_id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meeting URL */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-url">Meeting URL</Label>
            <Input
              id="meeting-url"
              type="url"
              placeholder="https://meet.google.com/abc-def-ghi"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Supports Google Meet, Microsoft Teams, and Zoom
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle>When should the bot join?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={joinTimeOption}
            onValueChange={(value) =>
              setJoinTimeOption(value as "now" | "scheduled")
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="now" id="now" />
              <Label htmlFor="now">Join Now</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="scheduled" id="scheduled" />
              <Label htmlFor="scheduled">Schedule for later</Label>
            </div>
          </RadioGroup>

          {joinTimeOption === "scheduled" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-10"
                    required={joinTimeOption === "scheduled"}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agendaTopics.map((topic, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label>Topic {index + 1}</Label>
                {agendaTopics.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAgendaTopic(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Input
                placeholder="Enter agenda topic"
                value={topic.topic}
                onChange={(e) =>
                  updateAgendaTopic(index, "topic", e.target.value)
                }
                required
              />

              <Textarea
                placeholder="Additional details (optional)"
                value={topic.details}
                onChange={(e) =>
                  updateAgendaTopic(index, "details", e.target.value)
                }
                rows={2}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addAgendaTopic}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Agenda Topic
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        {isLoading ? "Creating Meeting..." : "Create Meeting & Launch Bot"}
      </Button>
    </form>
  );
}
