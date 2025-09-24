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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type Meeting = Tables<"meetings">;

interface ReviewMinutesViewProps {
	meeting: Meeting;
}

export default function ReviewMinutesView({ meeting }: ReviewMinutesViewProps) {
	const router = useRouter();
	const initialContent =
		(meeting.structured_protocol as any)?.final_protocol_output || "";
	const [editedContent, setEditedContent] = useState(initialContent);
	const [isLoading, setIsLoading] = useState(false);
	const [aiEditInstruction, setAiEditInstruction] = useState("");
	const [isAiEditing, setIsAiEditing] = useState(false);

	const handleApprove = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/approve-protocol", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					meeting_id: meeting.meeting_id,
					approved_content: editedContent,
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
	};

	const handleAiEdit = async () => {
		if (!aiEditInstruction.trim()) return;

		setIsAiEditing(true);
		try {
			const response = await fetch("/api/apply-ai-edit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					current_content: editedContent,
					edit_instruction: aiEditInstruction,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to apply AI edit");
			}

			const data = await response.json();
			setEditedContent(data.updated_content);
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
				{/* Side-by-side editor and preview */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
					{/* Raw Markdown Editor */}
					<div className="space-y-2">
						<Label>Raw Markdown</Label>
						<Textarea
							value={editedContent}
							onChange={(e) => setEditedContent(e.target.value)}
							rows={20}
							className="font-mono h-96"
							placeholder="Edit your meeting minutes here..."
						/>
					</div>

					{/* Rendered Preview */}
					<div className="space-y-2">
						<Label>Preview</Label>
						<div className="border rounded-md p-4 h-96 overflow-auto bg-card">
							<div className="prose prose-invert max-w-none">
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									rehypePlugins={[rehypeRaw]}
								>
									{editedContent}
								</ReactMarkdown>
							</div>
						</div>
					</div>
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
