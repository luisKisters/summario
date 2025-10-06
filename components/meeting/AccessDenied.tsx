import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="py-10">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          This meeting is private or you do not have permission to view it.
        </p>
        <p className="text-muted-foreground mb-6">
          Please log in or request access from the meeting owner.
        </p>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    </div>
  );
}
