import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tables } from "@/types/database.types";

export default async function MeetingsPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	const { data: meetings, error } = await supabase
		.from("meetings")
		.select("*")
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching meetings:", error);
		// TODO: Add a proper error display component
		return <p>Error loading meetings.</p>;
	}

	return (
		<div className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Your Meetings</h1>
				<Link href="/meeting-setup">
					<Button>New Meeting</Button>
				</Link>
			</div>
			{meetings && meetings.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{meetings.map((meeting: Tables<"meetings">) => (
						<Link
							href={`/meeting/${meeting.meeting_id}`}
							key={meeting.meeting_id}
							className="block"
						>
							<Card className="h-full flex flex-col justify-between hover:border-primary transition-colors duration-200">
								<CardHeader>
									<CardTitle
										className="text-lg truncate"
										title={meeting.meeting_name || meeting.meeting_url}
									>
										{meeting.meeting_name || meeting.meeting_url}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-sm text-muted-foreground">
										Status:{" "}
										<span className="font-medium text-foreground capitalize">
											{meeting.status?.toLowerCase() || "Unknown"}
										</span>
									</div>
								</CardContent>
								<CardFooter>
									<p className="text-xs text-muted-foreground">
										{new Date(meeting.created_at).toLocaleString()}
									</p>
								</CardFooter>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<div className="text-center border-2 border-dashed border-muted rounded-lg p-12 mt-8">
					<h2 className="text-xl font-semibold">No Meetings Yet</h2>
					<p className="text-muted-foreground mt-2">
						Get started by creating your first meeting.
					</p>
					<Link href="/meeting-setup">
						<Button className="mt-4">Create Meeting</Button>
					</Link>
				</div>
			)}
		</div>
	);
}
