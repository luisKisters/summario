"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AgendaTopic } from "@/types";
import { CalendarIcon, Plus, X, Clock } from "lucide-react";
import { format } from "date-fns";

// Language definitions
const DEEPGRAM_LANGUAGES = [
  { code: "auto", name: "Auto-detect Language" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "tr", name: "Turkish" },
  { code: "no", name: "Norwegian" },
  { code: "id", name: "Indonesian" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "pl", name: "Polish" },
  { code: "ko", name: "Korean" },
  { code: "vi", name: "Vietnamese" },
];

const WHISPER_LANGUAGES = [
  { code: "auto", name: "Auto-detect Language" },
  { code: "af", name: "Afrikaans" },
  { code: "ar", name: "Arabic" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "be", name: "Belarusian" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "ca", name: "Catalan" },
  { code: "zh", name: "Chinese" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "et", name: "Estonian" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "gl", name: "Galician" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "id", name: "Indonesian" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "ko", name: "Korean" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "mk", name: "Macedonian" },
  { code: "ms", name: "Malay" },
  { code: "mr", name: "Marathi" },
  { code: "mi", name: "Maori" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sr", name: "Serbian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "es", name: "Spanish" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "tl", name: "Tagalog" },
  { code: "ta", name: "Tamil" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "vi", name: "Vietnamese" },
  { code: "cy", name: "Welsh" },
];

export function MeetingSetupForm() {
  const router = useRouter();

  // Form state
  const [meetingName, setMeetingName] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [agendaTopics, setAgendaTopics] = useState<AgendaTopic[]>([
    { topic: "", details: "" },
  ]);
  const [joinTimeOption, setJoinTimeOption] = useState<"now" | "scheduled">(
    "now"
  );
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [enableDiarization, setEnableDiarization] = useState(true);
  const [language, setLanguage] = useState("auto");
  const [sendMessage, setSendMessage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Get available languages based on diarization setting
  const getAvailableLanguages = () => {
    return enableDiarization ? DEEPGRAM_LANGUAGES : WHISPER_LANGUAGES;
  };

  // Check if current language is supported by the selected model
  const isLanguageSupported = (
    langCode: string,
    languages: typeof DEEPGRAM_LANGUAGES
  ) => {
    return languages.some((lang) => lang.code === langCode);
  };

  // Handle diarization change and validate language selection
  useEffect(() => {
    const availableLanguages = getAvailableLanguages();
    if (!isLanguageSupported(language, availableLanguages)) {
      // Reset to auto-detect if current language is not supported
      setLanguage("auto");
    }
  }, [enableDiarization, language]);

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
      if (!meetingName.trim()) {
        throw new Error("Meeting name is required");
      }
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
        meeting_name: meetingName.trim(),
        meeting_url: meetingUrl.trim(),
        agenda_topics: validAgendaTopics,
        start_time_option: joinTimeOption,
        enable_diarization: enableDiarization,
        language: language,
        send_initial_message: sendMessage,
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
      router.push(`/meeting/${data.meeting_id}`);
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
            <Label htmlFor="meeting-name">Meeting Name</Label>
            <Input
              id="meeting-name"
              type="text"
              placeholder="e.g. Q3 Planning"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              required
            />
          </div>
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

      {/* Transcription Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Transcription Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language-select">Meeting Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableLanguages().map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {enableDiarization
                ? `Showing ${
                    DEEPGRAM_LANGUAGES.length - 1
                  } languages supported by Deepgram with speaker identification.`
                : `Showing ${
                    WHISPER_LANGUAGES.length - 1
                  } languages supported by Whisper (no speaker identification).`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-diarization"
              checked={enableDiarization}
              onCheckedChange={(checked) =>
                setEnableDiarization(checked as boolean)
              }
            />
            <Label htmlFor="enable-diarization" className="text-sm font-medium">
              Enable speaker diarization
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            When enabled, the transcription will identify and label different
            speakers. Uses Assembly AI for better accuracy. When disabled, uses
            Whisper (faster but no speaker identification).
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-message"
              checked={sendMessage}
              onCheckedChange={(checked) => setSendMessage(checked as boolean)}
            />
            <Label htmlFor="send-message" className="text-sm font-medium">
              Send introductory message in chat
            </Label>
          </div>
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
