import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { UserDropdown } from "@/components/layout/UserDropdown";

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

  // ALWAYS show the navbar - no conditional rendering
  return (
    <nav className="border-b bg-background">
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center px-6 sm:px-8 lg:px-12">
        <div className="flex items-center space-x-4">
          <Link
            href={user ? "/meetings" : "/"}
            className="text-xl font-bold text-foreground hover:text-foreground/80"
          >
            Summario
          </Link>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <ThemeSwitcher />

          {user ? (
            <UserDropdown
              userEmail={user.email!}
              userInitials={getInitials(user.email!)}
            />
          ) : (
            <GoogleAuthButton />
          )}
        </div>
      </div>
    </nav>
  );
}
