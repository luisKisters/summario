"use client";

import { Tables } from "@/types/database.types";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type Meeting = Tables<"meetings">;

interface ApprovedMinutesViewProps {
	meeting: Meeting;
}

export default function ApprovedMinutesView({
	meeting,
}: ApprovedMinutesViewProps) {
	const [isCopied, setIsCopied] = useState(false);
	const protocolContent =
		(meeting.structured_protocol as any)?.final_protocol_output || "";

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(protocolContent);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
		} catch (error) {
			console.error("Failed to copy markdown", error);
		}
	};

	const handleExport = () => {
		const blob = new Blob([protocolContent], {
			type: "text/markdown;charset=utf-8",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `meeting-minutes-${meeting.meeting_id}.md`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Your Minutes are Approved</CardTitle>
			</CardHeader>
			<CardContent className="prose prose-invert max-w-none">
				<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
					{protocolContent}
				</ReactMarkdown>
			</CardContent>
			<CardFooter className="flex justify-end gap-2">
				<Button variant="outline" onClick={handleCopy}>
					{isCopied ? "Copied!" : "Copy Markdown"}
				</Button>
				<Button onClick={handleExport}>Export as .md file</Button>
			</CardFooter>
		</Card>
	);
}
