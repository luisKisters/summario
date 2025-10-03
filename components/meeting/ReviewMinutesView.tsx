"use client";

import { Tables } from "@/types/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TuiEditor, TuiEditorRef } from "@/components/ui/tui-editor";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

type Meeting = Tables<"meetings">;

interface ReviewMinutesViewProps {
  meeting: Meeting;
}

export default function ReviewMinutesView({ meeting }: ReviewMinutesViewProps) {
  const router = useRouter();
  const editorRef = useRef<TuiEditorRef>(null);
  const initialContent =
    (meeting.structured_protocol as any)?.final_protocol_output || "";
  const [editedContent, setEditedContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [aiEditInstruction, setAiEditInstruction] = useState("");
  const [isAiEditing, setIsAiEditing] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      // Get the latest content from the TUI Editor
      const currentContent = editorRef.current?.getMarkdown() || editedContent;

      const response = await fetch("/api/approve-protocol", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meeting_id: meeting.meeting_id,
          approved_content: currentContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve minutes");
      }

      // On success, refresh the page to show the approved view
      router.refresh();
    } catch (error) {
      console.error(error);
      // Here you would typically show a toast notification
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    setEditedContent(initialContent);
    editorRef.current?.setMarkdown(initialContent);
  };

  const handleAiEdit = async () => {
    if (!aiEditInstruction.trim()) return;

    setIsAiEditing(true);
    try {
      // Get current content from TUI Editor
      const currentContent = editorRef.current?.getMarkdown() || editedContent;

      const response = await fetch("/api/apply-ai-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_content: currentContent,
          edit_instruction: aiEditInstruction,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply AI edit");
      }

      const data = await response.json();
      // Update both state and TUI Editor
      setEditedContent(data.updated_content);
      editorRef.current?.setMarkdown(data.updated_content);
      setAiEditInstruction("");
    } catch (error) {
      console.error(error);
      // Here you would typically show a toast notification
    } finally {
      setIsAiEditing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Edit Your Minutes</CardTitle>
        <CardDescription>
          Make any necessary edits to your AI-generated meeting minutes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* WYSIWYG Editor */}
        <div className="space-y-2 mb-6">
          <Label>Edit Your Meeting Minutes</Label>
          <TuiEditor
            ref={editorRef}
            initialValue={initialContent}
            height="500px"
            placeholder="Edit your meeting minutes here..."
            onChange={setEditedContent}
          />
        </div>

        {/* AI Edit Section */}
        <div className="space-y-2">
          <Label htmlFor="ai-edit">AI Edit Instructions</Label>
          <div className="flex gap-2">
            <Input
              id="ai-edit"
              value={aiEditInstruction}
              onChange={(e) => setAiEditInstruction(e.target.value)}
              placeholder="Describe the changes you want the AI to make..."
              disabled={isAiEditing}
            />
            <Button
              onClick={handleAiEdit}
              disabled={isAiEditing || !aiEditInstruction.trim()}
              variant="secondary"
            >
              {isAiEditing ? "Applying..." : "Apply AI Edit"}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleDiscard} disabled={isLoading}>
          Discard Changes
        </Button>
        <Button onClick={handleApprove} disabled={isLoading}>
          {isLoading ? "Approving..." : "Approve & Save Minutes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
