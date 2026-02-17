import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AffiliateDisclosure } from "@/components/blog/AffiliateDisclosure";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog/posts";
import { fetchLinkPreviewImage } from "@/lib/blog/linkPreview";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

function shouldAttemptPreviewImage(href: string): boolean {
  try {
    const hostname = new URL(href).hostname.toLowerCase();
    return hostname === "nootropicsdepot.com" || hostname.endsWith(".nootropicsdepot.com");
  } catch {
    return false;
  }
}

function formatDate(dateString: string): string {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalPath = `/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.seoDescription,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      url: `https://www.entrain.app${canonicalPath}`,
      siteName: "Entrain",
      type: "article",
      publishedTime: `${post.publishedAt}T00:00:00Z`,
      modifiedTime: `${(post.updatedAt ?? post.publishedAt)}T00:00:00Z`,
      tags: post.tags,
    },
    twitter: {
      card: "summary",
      title: post.seoTitle,
      description: post.seoDescription,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const productCards = await Promise.all(
    post.affiliateProducts.map(async (product) => {
      const autoImageUrl = shouldAttemptPreviewImage(product.href) ? await fetchLinkPreviewImage(product.href) : null;

      return {
        ...product,
        resolvedImageUrl: product.imageUrl ?? autoImageUrl,
      };
    }),
  );
  const midpoint = Math.ceil(post.sections.length / 2);
  const firstHalfSections = post.sections.slice(0, midpoint);
  const secondHalfSections = post.sections.slice(midpoint);

  return (
    <main id="main-content" className="container mx-auto max-w-4xl px-4 py-10 lg:py-14">
      <article className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm lg:p-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">{post.category}</span>
          <span className="text-muted-foreground">Published {formatDate(post.publishedAt)}</span>
          {post.updatedAt ? <span className="text-muted-foreground">Updated {formatDate(post.updatedAt)}</span> : null}
          <span className="text-muted-foreground">{post.readTimeMinutes} min read</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">{post.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{post.heroSummary}</p>

        <div className="mt-8 space-y-8">
          {firstHalfSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
              <div className="mt-3 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed text-foreground/90">
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.bulletPoints ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-foreground/90">
                  {section.bulletPoints.map((bullet) => (
                    <li key={bullet} className="leading-relaxed">
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <section id="recommended-products-mid" className="mt-10 rounded-xl border border-border/70 bg-background/80 p-5">
          <h2 className="text-2xl font-semibold tracking-tight">{post.recommendedProductsHeading}</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Disclosure: links below may be affiliate links.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {productCards.map((product) => (
              <article key={`${product.id}-mid`} className="rounded-lg border border-border/70 bg-card p-4">
                {product.resolvedImageUrl ? (
                  <a
                    href={product.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="block overflow-hidden rounded-md border border-border/70"
                  >
                    <img
                      src={product.resolvedImageUrl}
                      alt={`${product.name} product image`}
                      loading="lazy"
                      className="h-40 w-full bg-white object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                  </a>
                ) : null}

                <h3 className={`text-lg font-semibold leading-snug ${product.resolvedImageUrl ? "mt-3" : ""}`}>
                  {product.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.reason}</p>
                <a
                  href={product.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-purple-700"
                >
                  {product.cta}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 space-y-8">
          {secondHalfSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
              <div className="mt-3 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed text-foreground/90">
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.bulletPoints ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-foreground/90">
                  {section.bulletPoints.map((bullet) => (
                    <li key={bullet} className="leading-relaxed">
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <section id="recommended-products" className="mt-10 rounded-xl border border-border/70 bg-background/80 p-5">
          <h2 className="text-2xl font-semibold tracking-tight">{post.recommendedProductsHeading}</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {productCards.map((product) => (
              <article key={product.id} className="rounded-lg border border-border/70 bg-card p-4">
                {product.resolvedImageUrl ? (
                  <a
                    href={product.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="block overflow-hidden rounded-md border border-border/70"
                  >
                    <img
                      src={product.resolvedImageUrl}
                      alt={`${product.name} product image`}
                      loading="lazy"
                      className="h-40 w-full bg-white object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                  </a>
                ) : null}

                <h3 className={`text-lg font-semibold leading-snug ${product.resolvedImageUrl ? "mt-3" : ""}`}>
                  {product.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.reason}</p>
                <a
                  href={product.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-purple-700"
                >
                  {product.cta}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>

          <AffiliateDisclosure
            className="mt-5"
            affiliateDisclosure={post.affiliateDisclosure}
            medicalDisclaimer={post.medicalDisclaimer}
          />
        </section>

        <div className="mt-8 border-t border-border/70 pt-6">
          <p className="text-sm text-muted-foreground">
            Looking for more practical routine guides? Browse all posts on the Entrain blog.
          </p>
          <Link
            href="/blog"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-purple-700"
          >
            Go to blog index
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </article>
    </main>
  );
}
