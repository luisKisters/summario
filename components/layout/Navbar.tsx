"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database.types";

type User = Tables<"users">;

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Don't show navbar on auth pages or root page
  const authPages = [
    "/auth/login",
    "/auth/sign-up",
    "/auth/forgot-password",
    "/auth/update-password",
    "/auth/error",
    "/auth/confirm",
    "/auth/sign-up-success",
  ];
  const isAuthPage =
    authPages.some((page) => pathname.startsWith(page)) || pathname === "/";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", authUser.id)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
        } else {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error in fetchUser:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Don't render navbar on auth pages or if not authenticated
  if (isAuthPage || !isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <nav className="border-b bg-background">
        <div className="w-full max-w-7xl mx-auto flex h-16 items-center px-6 sm:px-8 lg:px-12">
          <div className="flex items-center space-x-4">
            <Link
              href="/meetings"
              className="text-xl font-bold text-foreground hover:text-foreground/80"
            >
              Summario
            </Link>
          </div>
          <div className="ml-auto">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-background">
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center px-6 sm:px-8 lg:px-12">
        <div className="flex items-center space-x-4">
          <Link
            href="/meetings"
            className="text-xl font-bold text-foreground hover:text-foreground/80"
          >
            Summario
          </Link>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <ThemeSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.avatar_url ?? undefined}
                    alt={user?.full_name ?? "User"}
                  />
                  <AvatarFallback className="text-sm">
                    {getInitials(user?.full_name ?? null)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.full_name && (
                    <p className="font-medium">{user.full_name}</p>
                  )}
                  {user?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
