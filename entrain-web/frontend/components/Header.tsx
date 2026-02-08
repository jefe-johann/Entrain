"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { handleSignOut } from "@/app/actions";
import { Coins, Menu } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  credits: number;
  isAdmin?: boolean;
}

export function Header({ credits, isAdmin }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/generate", label: "Generate" },
    { href: "/dashboard", label: "History" },
    { href: "/shares", label: "Earn Credits" },
    { href: "/config-notes", label: "Affirmation Tips" },
  ];

  const navItemClass = (href: string) =>
    pathname === href
      ? "text-primary font-medium bg-primary/5"
      : "text-muted-foreground hover:text-foreground";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Skip to content
      </a>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/logo.png" alt="Entrain Logo" width={36} height={36} className="group-hover:scale-105 transition-transform" />
          <span className="text-lg font-bold bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent">
            Entrain
          </span>
        </Link>
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
              className={navItemClass(item.href)}
            >
              <Link href={item.href}>
                {item.label}
              </Link>
            </Button>
          ))}
          <div className="ml-2 pl-3 border-l border-border/60 flex items-center gap-3">
            <Link
              href="/credits"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-full hover:bg-secondary transition-colors"
            >
              <Coins className="w-3.5 h-3.5 text-purple-500" />
              {isAdmin ? "∞" : credits}
            </Link>
            <form action={handleSignOut}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-foreground"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="left-auto right-0 top-0 h-screen h-dvh w-[85vw] max-w-sm translate-x-0 translate-y-0 gap-6 rounded-none border-l border-border/60 p-5 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
            <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
            <DialogDescription className="sr-only">
              Access navigation links, credit balance, and account actions.
            </DialogDescription>
            <div className="mt-8 flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={`h-11 justify-start px-3 text-base ${navItemClass(item.href)}`}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </Button>
              ))}
            </div>
            <div className="mt-2 border-t border-border/60 pt-4">
              <Link
                href="/credits"
                onClick={() => setMobileMenuOpen(false)}
                className="mb-3 flex w-fit items-center gap-1.5 rounded-full bg-secondary/60 px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                <Coins className="h-3.5 w-3.5 text-purple-500" />
                {isAdmin ? "∞" : credits}
              </Link>
              <form action={handleSignOut}>
                <Button variant="ghost" className="h-11 w-full justify-start px-3 text-base text-muted-foreground hover:text-foreground">
                  Sign Out
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
