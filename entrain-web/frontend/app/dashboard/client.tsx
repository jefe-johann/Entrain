"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobStatusCard } from "@/components/JobStatusCard";
import { StorageUsageBar } from "@/components/StorageUsageBar";
import { api, Job, StorageInfo } from "@/lib/api";

interface DashboardClientProps {
  userEmail: string;
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const highlightJobId = searchParams.get("job");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      api.setUserEmail(userEmail);
      const [fetchedJobs, fetchedStorage] = await Promise.all([
        api.listJobs(),
        api.getStorageInfo(),
      ]);
      setJobs(fetchedJobs);
      setStorageInfo(fetchedStorage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const refreshStorage = async () => {
    try {
      api.setUserEmail(userEmail);
      const storage = await api.getStorageInfo();
      setStorageInfo(storage);
    } catch {
      // Silently fail - storage bar will just be stale
    }
  };

  useEffect(() => {
    fetchData();
  }, [userEmail]);

  const handleDelete = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    refreshStorage();
  };

  const handleArchive = (archivedJob: Job) => {
    setJobs((prev) => prev.map((j) => (j.id === archivedJob.id ? archivedJob : j)));
    refreshStorage();
  };

  const handleRegenerate = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
    refreshStorage();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading your tracks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchData}>Try Again</Button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No meditation tracks yet.</p>
        <Link href="/generate">
          <Button>Create Your First Track</Button>
        </Link>
      </div>
    );
  }

  // Sort jobs: highlighted first, then by created_at desc
  const sortedJobs = [...jobs].sort((a, b) => {
    if (a.id === highlightJobId) return -1;
    if (b.id === highlightJobId) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      {storageInfo && <StorageUsageBar storageInfo={storageInfo} />}
      {sortedJobs.map((job) => (
        <div
          key={job.id}
          className={job.id === highlightJobId ? "ring-2 ring-primary rounded-lg" : ""}
        >
          <JobStatusCard
            job={job}
            userEmail={userEmail}
            onDelete={() => handleDelete(job.id)}
            onArchive={handleArchive}
            onRegenerate={handleRegenerate}
          />
        </div>
      ))}
    </div>
  );
}
