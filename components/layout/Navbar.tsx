import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { UserDropdown } from "@/components/layout/UserDropdown";
import { cn } from "@/lib/utils";

export async function Navbar() {
  const supabase = await createClient();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  // Get user from claims like in auth-button
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Logo - Always visible */}
        <div className="flex items-center">
          <Link
            href={user ? "/meetings" : "/"}
            className="text-xl font-bold text-foreground hover:text-foreground/80 font-handwriting" // Added font-handwriting class if available, or just keeping it simple
          >
            Summario
          </Link>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        {user && (
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/meetings"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/meetings"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Meetings
            </Link>
            <Link
              href="/templates"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/templates"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Templates
            </Link>
          </div>
        )}

        {/* Desktop Profile - Hidden on Mobile */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <UserDropdown
              userEmail={user.email!}
              userInitials={getInitials(user.email!)}
            />
          ) : (
            <GoogleAuthButton />
          )}
        </div>

        {/* Mobile Auth Button (if not logged in) - Visible on Mobile */}
        {!user && (
          <div className="md:hidden">
            <GoogleAuthButton />
          </div>
        )}
      </div>
    </nav>
  );
}
