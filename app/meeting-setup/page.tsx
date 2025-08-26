import { MeetingSetupForm } from "@/components/meeting-setup/MeetingSetupForm";

export default function MeetingSetupPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create New Meeting
        </h1>
        <p className="text-muted-foreground">
          Set up a new meeting and deploy the Summario bot to automatically
          transcribe and summarize your conversation.
        </p>
      </div>

      <MeetingSetupForm />
    </div>
  );
}
