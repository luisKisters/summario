"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface UserDropdownProps {
  userEmail: string;
  userInitials: string;
}

export function UserDropdown({ userEmail, userInitials }: UserDropdownProps) {
  const router = useRouter();
  const supabase = createClient();
  const { setTheme, theme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary transition-colors">
            <AvatarImage src={undefined} alt={userEmail} />
            <AvatarFallback className="text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={undefined} alt={userEmail} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5 leading-none">
            <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
              {userEmail.split("@")[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              {userEmail}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
            Account Settings
          </p>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-0 flex items-center justify-center",
                theme === "light" && "border-primary bg-primary/5 text-primary"
              )}
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              <span className="sr-only">Light</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-0 flex items-center justify-center",
                theme === "dark" && "border-primary bg-primary/5 text-primary"
              )}
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              <span className="sr-only">Dark</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-0 flex items-center justify-center",
                theme === "system" && "border-primary bg-primary/5 text-primary"
              )}
              onClick={() => setTheme("system")}
            >
              <Laptop className="h-4 w-4" />
              <span className="sr-only">System</span>
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
