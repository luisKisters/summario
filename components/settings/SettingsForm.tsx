"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type SettingsFormProps = {
  initialExampleProtocol: string;
  initialAiPrompt: string;
  initialAiTemplate: string;
};

export default function SettingsForm({
  initialExampleProtocol,
  initialAiPrompt,
  initialAiTemplate,
}: SettingsFormProps) {
  const [exampleProtocol, setExampleProtocol] = useState(
    initialExampleProtocol
  );
  const [aiPrompt, setAiPrompt] = useState(initialAiPrompt);
  const [aiTemplate, setAiTemplate] = useState(initialAiTemplate);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="bg-card text-foreground border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            1. Provide an Example
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={exampleProtocol}
            onChange={(e) => setExampleProtocol(e.target.value)}
            placeholder="Paste your ideal meeting protocol in Markdown here..."
            className="min-h-48 bg-background text-foreground border-border"
          />
          <Button
            type="button"
            onClick={() => void 0}
            disabled={isGenerating || exampleProtocol.trim().length === 0}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            {isGenerating ? "Generating..." : "Generate My Template"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card text-foreground border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            2. Your AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">AI Prompt</div>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="The generated system prompt will appear here."
              className="min-h-40 bg-background text-foreground border-border"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">AI Template</div>
            <Textarea
              value={aiTemplate}
              onChange={(e) => setAiTemplate(e.target.value)}
              placeholder="The generated template will appear here."
              className="min-h-40 bg-background text-foreground border-border"
            />
          </div>
          <Button
            type="button"
            onClick={() => void 0}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
