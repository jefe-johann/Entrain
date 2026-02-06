"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobStatusCard } from "@/components/JobStatusCard";
import { api, Job } from "@/lib/api";

interface DashboardClientProps {
  userEmail: string;
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const highlightJobId = searchParams.get("job");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      api.setUserEmail(userEmail);
      const fetchedJobs = await api.listJobs();
      setJobs(fetchedJobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [userEmail]);

  const handleDelete = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
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
        <Button onClick={fetchJobs}>Try Again</Button>
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
      {sortedJobs.map((job) => (
        <div
          key={job.id}
          className={job.id === highlightJobId ? "ring-2 ring-primary rounded-lg" : ""}
        >
          <JobStatusCard
            job={job}
            userEmail={userEmail}
            onDelete={() => handleDelete(job.id)}
          />
        </div>
      ))}
    </div>
  );
}
