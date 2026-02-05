"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { handleSignOut } from "@/app/actions";

interface HeaderProps {
  credits: number;
}

export function Header({ credits }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Entrain
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/generate">
            <Button
              variant="ghost"
              className={pathname === "/generate" ? "border-b-2 border-primary rounded-none" : ""}
            >
              New Track
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className={pathname === "/dashboard" ? "border-b-2 border-primary rounded-none" : ""}
            >
              Dashboard
            </Button>
          </Link>
          <Link href="/config-notes">
            <Button
              variant="ghost"
              className={pathname === "/config-notes" ? "border-b-2 border-primary rounded-none" : ""}
            >
              Affirmation Tips
            </Button>
          </Link>
          <div className="text-sm text-muted-foreground">
            {credits} credits
          </div>
          <form action={handleSignOut}>
            <Button variant="outline" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
