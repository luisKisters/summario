import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("example_protocol, ai_generated_prompt, ai_generated_template")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground">
        Your Protocol Settings
      </h1>
      <SettingsForm
        initialExampleProtocol={profile?.example_protocol ?? ""}
        initialAiPrompt={profile?.ai_generated_prompt ?? ""}
        initialAiTemplate={profile?.ai_generated_template ?? ""}
      />
    </div>
  );
}
