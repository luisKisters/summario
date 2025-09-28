"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Tables, TablesUpdate } from "@/types/database.types";
import { useRouter } from "next/navigation";

type SettingsFormProps = {
  initialExampleProtocol: string;
  initialAiPrompt: string;
  initialAiTemplate: string;
  initialInstructions: string;
};

export default function SettingsForm({
  initialExampleProtocol,
  initialAiPrompt,
  initialAiTemplate,
  initialInstructions,
}: SettingsFormProps) {
  const [exampleProtocol, setExampleProtocol] = useState(
    initialExampleProtocol
  );
  const [aiPrompt, setAiPrompt] = useState(initialAiPrompt);
  const [aiTemplate, setAiTemplate] = useState(initialAiTemplate);
  const [userInstructions, setUserInstructions] = useState(initialInstructions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleGenerateTemplate = async () => {
    if (!exampleProtocol.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          example_protocol: exampleProtocol,
          user_instructions: userInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate template");
      }

      const data: Pick<
        Tables<"users">,
        "ai_generated_prompt" | "ai_generated_template"
      > = await response.json();
      setAiPrompt(data.ai_generated_prompt ?? "");
      setAiTemplate(data.ai_generated_template ?? "");
    } catch (error) {
      console.error("Error generating template:", error);
      alert(
        error instanceof Error ? error.message : "Failed to generate template"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const updateData: TablesUpdate<"users"> = {
        example_protocol: exampleProtocol,
        ai_generated_prompt: aiPrompt,
        ai_generated_template: aiTemplate,
        instructions: userInstructions,
      };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Template Generator */}
      <div className="space-y-6">
        <Card className="bg-card text-foreground border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              1. Provide an Example Minutes Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={exampleProtocol}
              onChange={(e) => setExampleProtocol(e.target.value)}
              placeholder="Paste your ideal meeting minutes in Markdown here..."
              className="min-h-48 bg-background text-foreground border-border"
            />
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              2. Additional Instructions & Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Provide any specific instructions, context, or preferences for how
              the AI should analyze your minutes document. For example: "Always
              use bullet points for action items" or "Keep the tone formal and
              professional".
            </div>
            <Textarea
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              placeholder="Add any specific instructions or context here..."
              className="min-h-32 bg-background text-foreground border-border"
            />
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              3. Generate Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              onClick={handleGenerateTemplate}
              disabled={isGenerating || exampleProtocol.trim().length === 0}
              className="w-full bg-primary text-primary-foreground hover:opacity-90"
            >
              {isGenerating ? "Generating..." : "Generate My Template"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Output */}
      <div className="space-y-6">
        <Card className="bg-card text-foreground border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              4. Generated AI Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="The generated system prompt will appear here."
              className="min-h-40 bg-background text-foreground border-border"
            />
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              5. Generated AI Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={aiTemplate}
              onChange={(e) => setAiTemplate(e.target.value)}
              placeholder="The generated template will appear here."
              className="min-h-40 bg-background text-foreground border-border"
            />
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground border-border">
          <CardHeader>
            <CardTitle className="text-foreground">6. Save Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/meetings")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
