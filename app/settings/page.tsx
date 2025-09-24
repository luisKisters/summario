import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/settings/SettingsForm";
import { Tables } from "@/types/database.types";

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
		.select(
			"example_protocol, ai_generated_prompt, ai_generated_template, instructions"
		)
		.eq("user_id", user!.id)
		.single<
			Pick<
				Tables<"users">,
				| "example_protocol"
				| "ai_generated_prompt"
				| "ai_generated_template"
				| "instructions"
			>
		>();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
			<h1 className="text-2xl font-semibold text-foreground">
				Your Minutes Settings
			</h1>
			<SettingsForm
				initialExampleProtocol={profile?.example_protocol ?? ""}
				initialAiPrompt={profile?.ai_generated_prompt ?? ""}
				initialAiTemplate={profile?.ai_generated_template ?? ""}
				initialInstructions={profile?.instructions ?? ""}
			/>
		</div>
	);
}
