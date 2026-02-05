"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { handleSignOut } from "@/app/actions";
import { Coins } from "lucide-react";

interface HeaderProps {
  credits: number;
}

export function Header({ credits }: HeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/generate", label: "Generate" },
    { href: "/dashboard", label: "History" },
    { href: "/config-notes", label: "Affirmation Tips" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/logo.png" alt="Entrain Logo" width={36} height={36} className="group-hover:scale-105 transition-transform" />
          <span className="text-lg font-bold bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent">
            Entrain
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
              className={
                pathname === item.href
                  ? "text-primary font-medium bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              <Link href={item.href}>
                {item.label}
              </Link>
            </Button>
          ))}
          <div className="ml-2 pl-3 border-l border-border/60 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-full">
              <Coins className="w-3.5 h-3.5 text-purple-500" />
              {credits}
            </div>
            <form action={handleSignOut}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
