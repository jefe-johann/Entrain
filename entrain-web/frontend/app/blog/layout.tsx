import type { Metadata } from "next";
import { BlogShellHeader } from "@/components/blog/BlogShellHeader";

export const metadata: Metadata = {
  title: {
    default: "Blog - Entrain",
    template: "%s | Entrain Blog",
  },
  description:
    "Meditation, subliminal, and mental wellness insights to help you build better routines and get more from your audio practice.",
  openGraph: {
    title: "Entrain Blog",
    description:
      "Meditation, subliminal, and mental wellness insights to help you build better routines and get more from your audio practice.",
    url: "https://www.entrain.app/blog",
    siteName: "Entrain",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Entrain Blog",
    description:
      "Meditation, subliminal, and mental wellness insights to help you build better routines and get more from your audio practice.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-violet-50 via-background to-indigo-50/60 pointer-events-none" />
      <div className="relative z-10">
        <BlogShellHeader />
        {children}
      </div>
    </div>
  );
}
