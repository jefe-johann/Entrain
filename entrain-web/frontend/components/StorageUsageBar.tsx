"use client";

import { Progress } from "@/components/ui/progress";
import { StorageInfo } from "@/lib/api";
import { formatBytes } from "@/lib/utils";

interface StorageUsageBarProps {
  storageInfo: StorageInfo;
}

export function StorageUsageBar({ storageInfo }: StorageUsageBarProps) {
  const { used_bytes, limit_bytes, used_percentage } = storageInfo;
  const isFull = used_percentage >= 100;
  const isWarning = used_percentage >= 80;

  return (
    <div className="space-y-2 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Storage</span>
        <span className="text-muted-foreground">
          {formatBytes(used_bytes)} / {formatBytes(limit_bytes)} used
        </span>
      </div>
      <Progress
        value={Math.min(used_percentage, 100)}
        className={
          isFull
            ? "[&>div]:bg-destructive"
            : isWarning
              ? "[&>div]:bg-yellow-500"
              : ""
        }
      />
      <p className="text-xs text-muted-foreground">
        {isFull
          ? "Storage full. Archive or delete old tracks to generate new ones."
          : "Files auto-delete after 7 days. Download your tracks to keep them forever!"}
      </p>
    </div>
  );
}
