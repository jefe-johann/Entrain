import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog/posts";

const BASE_URL = "https://www.entrain.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date("2026-02-08T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/generate`,
      lastModified: new Date("2026-02-08T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/shares`,
      lastModified: new Date("2026-02-08T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/credits`,
      lastModified: new Date("2026-02-08T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/config-notes`,
      lastModified: new Date("2026-02-08T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = getAllBlogPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.updatedAt ?? post.publishedAt}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...blogRoutes];
}
