"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
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
}

export function JobStatusCard({ job: initialJob, userEmail, onDelete }: JobStatusCardProps) {
  const [job, setJob] = useState(initialJob);
  const [isPolling, setIsPolling] = useState(
    initialJob.status === "pending" || initialJob.status === "processing"
  );

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

        if (status.status === "completed" || status.status === "failed") {
          setIsPolling(false);
          if (status.status === "completed") {
            toast.success("Your meditation track is ready!");
            // Fetch full job to get file info
            const fullJob = await api.getJob(job.id);
            setJob(fullJob);
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
      const voice = config.voice_id || "unknown";
      const duration = config.duration_minutes || 40;
      link.download = `meditation-${voice}-${duration}min.flac`;

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
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      api.setUserEmail(userEmail);
      await api.deleteJob(job.id);
      toast.success("Job deleted");
      onDelete?.();
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  const statusIcon = {
    pending: <Clock className="h-5 w-5 text-muted-foreground" />,
    processing: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
    completed: <CheckCircle className="h-5 w-5 text-green-500" />,
    failed: <XCircle className="h-5 w-5 text-destructive" />,
  };

  const statusText = {
    pending: "Waiting in queue...",
    processing: job.progress_message || "Processing...",
    completed: "Ready to download",
    failed: job.error_message || "Generation failed",
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
          <div className="flex items-center gap-2">
            {statusIcon[job.status]}
            <CardTitle className="text-lg">
              {config.voice_id} - {formatDuration(config.duration_minutes || 40)}
            </CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(job.created_at).toLocaleDateString()}
          </div>
        </div>
        <CardDescription>
          {affirmationCount} affirmations, {config.binaural_preset || "theta"} wave
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
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {job.file_size_bytes && formatBytes(job.file_size_bytes)}
            </div>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download FLAC
            </Button>
          </div>
        )}

        {/* Failed */}
        {job.status === "failed" && (
          <div className="text-sm text-destructive">{statusText.failed}</div>
        )}

        {/* Delete button for non-processing jobs */}
        {job.status !== "processing" && (
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-muted-foreground">
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
