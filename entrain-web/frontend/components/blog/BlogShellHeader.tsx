import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BlogShellHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="Entrain Logo"
            width={34}
            height={34}
            className="transition-transform group-hover:scale-105"
          />
          <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent">
            Entrain
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/blog"
            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Blog
          </Link>
          <Button asChild size="sm" className="rounded-lg">
            <Link href="/">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
