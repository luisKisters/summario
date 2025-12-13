"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutTemplate, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/meetings",
      label: "Meetings",
      icon: Calendar,
    },
    {
      href: "/templates", // Assuming this route exists or will exist
      label: "Templates",
      icon: LayoutTemplate,
    },
    {
      href: "/settings", // Profile/Settings route
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg md:hidden">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
