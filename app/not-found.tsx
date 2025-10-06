import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-10">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The page you are looking for does not exist.
        </p>
        <Button asChild>
          <Link href="/meetings">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
