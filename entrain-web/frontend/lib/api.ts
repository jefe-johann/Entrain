/**
 * API client for Entrain backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface JobConfig {
  affirmations: string[];
  title?: string;
  voice_id?: string;
  duration_minutes?: number;
  binaural_preset?: "delta" | "theta" | "alpha" | "beta";
  binaural_frequency_hz?: number;
  affirmation_volume_db?: number;
  binaural_volume_db?: number;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  lowpass_filter?: {
    enabled?: boolean;
    cutoff_hz?: number;
  };
  repetitions?: number;
}

interface Job {
  id: string;
  user_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  progress_message: string | null;
  error_message: string | null;
  config: JobConfig;
  file_path: string | null;
  file_size_bytes: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface JobStatus {
  id: string;
  status: string;
  progress: number;
  progress_message: string | null;
  error_message: string | null;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  credits: number;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private baseUrl: string;
  private userEmail: string | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  setUserEmail(email: string | null) {
    this.userEmail = email;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.userEmail) {
      headers["X-User-Email"] = this.userEmail;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API error: ${response.status}`);
    }

    return response.json();
  }

  // User endpoints
  async getMe(): Promise<User> {
    return this.fetch<User>("/api/users/me");
  }

  async syncUser(data: {
    email: string;
    name?: string;
    image?: string;
  }): Promise<User> {
    return this.fetch<User>("/api/users/sync", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Job endpoints
  async createJob(config: JobConfig): Promise<Job> {
    return this.fetch<Job>("/api/jobs", {
      method: "POST",
      body: JSON.stringify({ config }),
    });
  }

  async listJobs(limit = 20, offset = 0): Promise<Job[]> {
    return this.fetch<Job[]>(`/api/jobs?limit=${limit}&offset=${offset}`);
  }

  async getJob(jobId: string): Promise<Job> {
    return this.fetch<Job>(`/api/jobs/${jobId}`);
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.fetch<JobStatus>(`/api/jobs/${jobId}/status`);
  }

  async deleteJob(jobId: string): Promise<void> {
    await this.fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
  }

  // File endpoints
  getDownloadUrl(jobId: string): string {
    return `${this.baseUrl}/api/files/${jobId}`;
  }
}

export const api = new ApiClient();
export type { Job, JobConfig, JobStatus, User };
