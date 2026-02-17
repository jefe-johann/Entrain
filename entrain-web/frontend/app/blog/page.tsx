import type { Metadata } from "next";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getAllBlogPosts } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Actionable guides on meditation, subliminals, and mental wellness. Start with our Reishi deep dive for evening routine support.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Entrain Blog",
    description:
      "Actionable guides on meditation, subliminals, and mental wellness. Start with our Reishi deep dive for evening routine support.",
    url: "https://www.entrain.app/blog",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Entrain Blog",
    description:
      "Actionable guides on meditation, subliminals, and mental wellness. Start with our Reishi deep dive for evening routine support.",
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <main id="main-content" className="container mx-auto max-w-5xl px-4 py-10 lg:py-14">
      <section className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Entrain Blog</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">
          Simple guides for better meditation routines
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          We publish practical, lightweight articles focused on habit quality, supplement support, and how to get more
          value from affirmation and subliminal audio.
        </p>
      </section>

      <section className="mt-8 space-y-6">
        {posts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </section>
    </main>
  );
}
