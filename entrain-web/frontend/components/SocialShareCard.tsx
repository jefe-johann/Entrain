"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IconType } from "react-icons";
import {
  FaDiscord,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaRedditAlien,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

interface SocialShareCardProps {
  referralLink: string;
}

const SHARE_MESSAGE =
  "I've had life changing experiences with binaural subliminals. I've been using this site to make my own. Try it out!";

const COPY_SHARE_DESTINATIONS = [
  {
    label: "Instagram",
    url: "https://www.instagram.com/",
    icon: FaInstagram,
    iconClassName: "text-[#E4405F]",
  },
  {
    label: "YouTube",
    url: "https://www.youtube.com/",
    icon: FaYoutube,
    iconClassName: "text-[#FF0000]",
  },
  {
    label: "Discord",
    url: "https://discord.com/app",
    icon: FaDiscord,
    iconClassName: "text-[#5865F2]",
  },
] as const;

interface ShareLink {
  label: string;
  href: string;
  icon: IconType;
  iconClassName: string;
}

export function SocialShareCard({ referralLink }: SocialShareCardProps) {
  const encodedLink = encodeURIComponent(referralLink);
  const encodedMessage = encodeURIComponent(SHARE_MESSAGE);

  const shareLinks: ShareLink[] = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`,
      icon: FaFacebook,
      iconClassName: "text-[#1877F2]",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
      icon: FaXTwitter,
      iconClassName: "text-black",
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      icon: FaLinkedin,
      iconClassName: "text-[#0A66C2]",
    },
    {
      label: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodedLink}&title=${encodedMessage}`,
      icon: FaRedditAlien,
      iconClassName: "text-[#FF4500]",
    },
  ];

  const handleCopyShareText = async (platform: string, platformUrl: string) => {
    try {
      await navigator.clipboard.writeText(`${SHARE_MESSAGE} ${referralLink}`);
      toast.success(`${platform} share text copied with your affiliate link`);
      window.open(platformUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not copy share text");
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Share on social</CardTitle>
        <p className="text-sm text-muted-foreground">
          These buttons include your affiliate link.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {shareLinks.map((shareLink) => (
            <Button key={shareLink.label} variant="outline" size="icon" asChild>
              <a
                href={shareLink.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={shareLink.label}
                title={shareLink.label}
              >
                <shareLink.icon className={`h-5 w-5 ${shareLink.iconClassName}`} />
                <span className="sr-only">{shareLink.label}</span>
              </a>
            </Button>
          ))}

          {COPY_SHARE_DESTINATIONS.map((destination) => (
            <Button
              key={destination.label}
              type="button"
              variant="outline"
              size="icon"
              aria-label={destination.label}
              title={destination.label}
              onClick={() => void handleCopyShareText(destination.label, destination.url)}
            >
              <destination.icon className={`h-5 w-5 ${destination.iconClassName}`} />
              <span className="sr-only">{destination.label}</span>
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Instagram, YouTube, and Discord do not support prefilled web share links, so those buttons copy your message first.
        </p>
      </CardContent>
    </Card>
  );
}
