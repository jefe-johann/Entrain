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
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {isFull ? (
            <>
              Storage full. Archive downloaded tracks to free up space—you can
              regenerate them anytime!
            </>
          ) : isWarning ? (
            <>
              Running low on space! Archive tracks you've downloaded to stay under
              your 250 MB limit.
            </>
          ) : (
            <>
              Files auto-delete after 1 day. Download your tracks to keep them
              forever!
            </>
          )}
        </p>
        {!isFull && (
          <p className="text-xs text-muted-foreground/80">
            💡 Tip: Archive downloaded tracks to free up your 250 MB storage—regenerate
            them anytime.
          </p>
        )}
      </div>
    </div>
  );
}
