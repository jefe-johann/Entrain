"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Loader2, CheckCircle, XCircle, Clock, Archive, RefreshCw, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api, Job, JobStatus } from "@/lib/api";
import { formatBytes, formatDuration } from "@/lib/utils";

interface JobStatusCardProps {
  job: Job;
  userEmail: string;
  onDelete?: () => void;
  onArchive?: (archivedJob: Job) => void;
  onRegenerate?: (newJob: Job) => void;
  onComplete?: () => void;
}

export function JobStatusCard({ job: initialJob, userEmail, onDelete, onArchive, onRegenerate, onComplete }: JobStatusCardProps) {
  const [job, setJob] = useState(initialJob);
  const [isPolling, setIsPolling] = useState(
    initialJob.status === "pending" || initialJob.status === "processing"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(initialJob.config.title || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const canEdit = job.status === "completed" || job.status === "archived";

  const handleRename = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === (job.config.title || "")) {
      setIsEditing(false);
      setEditTitle(job.config.title || "");
      return;
    }

    try {
      api.setUserEmail(userEmail);
      const updatedJob = await api.renameJob(job.id, trimmed);
      setJob(updatedJob);
      setEditTitle(trimmed);
      toast.success("Track renamed");
    } catch {
      toast.error("Failed to rename track");
      setEditTitle(job.config.title || "");
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Poll for status updates
  useEffect(() => {
    if (!isPolling) return;

    api.setUserEmail(userEmail);

    const interval = setInterval(async () => {
      try {
        const status = await api.getJobStatus(job.id);
        setJob((prev) => ({
          ...prev,
          status: status.status as Job["status"],
          progress: status.progress,
          progress_message: status.progress_message,
          error_message: status.error_message,
        }));

        if (status.status === "completed" || status.status === "failed" || status.status === "archived") {
          setIsPolling(false);
          if (status.status === "completed") {
            toast.success("Your meditation track is ready!");
            // Fetch full job to get file info
            const fullJob = await api.getJob(job.id);
            setJob(fullJob);
            onComplete?.();
          } else if (status.status === "failed") {
            toast.error("Generation failed: " + (status.error_message || "Unknown error"));
          }
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPolling, job.id, userEmail]);

  const handleDownload = async () => {
    try {
      api.setUserEmail(userEmail);
      const url = api.getDownloadUrl(job.id);

      // Fetch with auth headers
      const response = await fetch(url, {
        headers: {
          "X-User-Email": userEmail,
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;

      // Generate filename
      const config = job.config;
      if (config.title) {
        // Use custom title if provided
        // Sanitize the title for filename (replace invalid chars with hyphens)
        const sanitizedTitle = config.title.replace(/[/\\?%*:|"<>]/g, '-').trim();
        link.download = `${sanitizedTitle}.flac`;
      } else {
        // Fall back to default format
        const voice = config.voice_id || "unknown";
        const duration = config.duration_minutes || 40;
        link.download = `meditation-${voice}-${duration}min.flac`;
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this job?")) return;

    try {
      api.setUserEmail(userEmail);
      await api.deleteJob(job.id);
      toast.success("Job deleted");
      onDelete?.();
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  const handleArchive = async () => {
    if (!confirm("Archive this track? The file will be removed but you can regenerate it later.")) return;

    try {
      api.setUserEmail(userEmail);
      const archivedJob = await api.archiveJob(job.id);
      setJob(archivedJob);
      toast.success("Track archived");
      onArchive?.(archivedJob);
    } catch (error) {
      toast.error("Failed to archive track");
    }
  };

  const handleRegenerate = async () => {
    try {
      api.setUserEmail(userEmail);
      const newJob = await api.regenerateJob(job.id);
      toast.success("Regeneration started!");
      onRegenerate?.(newJob);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to regenerate");
    }
  };

  const statusIcon: Record<Job["status"], React.ReactNode> = {
    pending: <Clock className="h-5 w-5 text-muted-foreground" />,
    processing: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
    completed: <CheckCircle className="h-5 w-5 text-green-500" />,
    failed: <XCircle className="h-5 w-5 text-destructive" />,
    archived: <Archive className="h-5 w-5 text-muted-foreground" />,
  };

  const statusText: Record<Job["status"], string> = {
    pending: "Waiting in queue...",
    processing: job.progress_message || "Processing...",
    completed: "Ready to download",
    failed: job.error_message || "Generation failed",
    archived: "Archived - config saved for regeneration",
  };

  // Compute days until auto-archive for completed jobs
  const getExpiryText = () => {
    if (job.status !== "completed" || !job.completed_at) return null;
    const completedDate = new Date(job.completed_at);
    const expiryDate = new Date(completedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysLeft <= 0) return "Auto-archives soon";
    return `Auto-archives in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
  };

  // Format config for display
  const config = job.config;
  const affirmationCount = Array.isArray(config.affirmations)
    ? config.affirmations.length
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {statusIcon[job.status]}
            {isEditing ? (
              <input
                ref={inputRef}
                name="job_title"
                aria-label="Track title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setEditTitle(job.config.title || "");
                    setIsEditing(false);
                  }
                }}
                maxLength={100}
                className="text-lg font-semibold bg-transparent border-b border-primary outline-none px-0 py-0 w-full"
              />
            ) : (
              <CardTitle
                className={`text-lg ${canEdit ? "cursor-pointer hover:text-primary transition-colors group/title" : ""}`}
                onClick={canEdit ? () => { setEditTitle(config.title || config.voice_id || ""); setIsEditing(true); } : undefined}
              >
                <span>{config.title || config.voice_id} - {formatDuration(config.duration_minutes || 40)}</span>
                {canEdit && (
                  <Pencil className="inline-block ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/title:opacity-100 transition-opacity" />
                )}
              </CardTitle>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(job.created_at).toLocaleDateString()}
          </div>
        </div>
        <CardDescription>
          {affirmationCount} affirmations, {config.binaural_preset || "theta"} wave
          {config.title && ` • ${config.voice_id} voice`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {(job.status === "pending" || job.status === "processing") && (
          <div className="space-y-2">
            <Progress value={job.progress} />
            <p className="text-sm text-muted-foreground">{statusText[job.status]}</p>
          </div>
        )}

        {/* Completed */}
        {job.status === "completed" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {job.file_size_bytes && formatBytes(job.file_size_bytes)}
                {getExpiryText() && (
                  <span className="ml-2 text-yellow-600">{getExpiryText()}</span>
                )}
              </div>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download FLAC
              </Button>
            </div>
          </div>
        )}

        {/* Archived */}
        {job.status === "archived" && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Config saved for regeneration</p>
            <Button variant="outline" onClick={handleRegenerate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        )}

        {/* Failed */}
        {job.status === "failed" && (
          <div className="text-sm text-destructive">{statusText.failed}</div>
        )}

        {/* Action buttons for non-processing jobs */}
        {job.status !== "processing" && job.status !== "pending" && (
          <div className="pt-2 border-t flex gap-2">
            {job.status === "completed" && (
              <Button variant="ghost" size="sm" onClick={handleArchive} className="text-muted-foreground">
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
