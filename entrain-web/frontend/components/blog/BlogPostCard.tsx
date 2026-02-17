import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogPost } from "@/lib/blog/posts";

interface BlogPostCardProps {
  post: BlogPost;
}

function formatDate(dateString: string): string {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <article className="group rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">{post.category}</span>
        <span className="text-muted-foreground">{formatDate(post.publishedAt)}</span>
        <span className="text-muted-foreground">{post.readTimeMinutes} min read</span>
      </div>

      <h2 className="mt-4 text-2xl font-semibold tracking-tight">
        <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-primary">
          {post.title}
        </Link>
      </h2>

      <p className="mt-3 text-muted-foreground leading-relaxed">{post.excerpt}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {post.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>

      <Link
        href={`/blog/${post.slug}`}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors group-hover:text-purple-700"
      >
        Read article
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
