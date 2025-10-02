import { MeetingSetupForm } from "@/components/meeting-setup/MeetingSetupForm";

export default function MeetingSetupPage() {
  return (
    <div className="py-8 w-full">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create New Meeting
        </h1>
        <p className="text-muted-foreground">
          Set up a new meeting and deploy the Summario bot to automatically
          transcribe and summarize your conversation.
        </p>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <MeetingSetupForm />
      </div>
    </div>
  );
}
