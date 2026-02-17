function parseTagAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern = /([a-zA-Z:-]+)\s*=\s*(["'])(.*?)\2/g;

  for (const match of tag.matchAll(attributePattern)) {
    const name = match[1]?.toLowerCase();
    const value = match[3];

    if (name && value) {
      attributes[name] = value;
    }
  }

  return attributes;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function resolveUrl(candidate: string, baseUrl: string): string | null {
  const decoded = decodeHtmlEntities(candidate.trim());

  if (!decoded) {
    return null;
  }

  try {
    const url = decoded.startsWith("//")
      ? new URL(`https:${decoded}`)
      : new URL(decoded, baseUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function findMetaImageUrl(html: string, baseUrl: string): string | null {
  const metaTagPattern = /<meta\s+[^>]*>/gi;
  const preferredKeys = [
    { attr: "property", value: "og:image:secure_url" },
    { attr: "property", value: "og:image" },
    { attr: "name", value: "twitter:image" },
    { attr: "name", value: "twitter:image:src" },
  ];

  const candidates: string[] = [];

  for (const tag of html.match(metaTagPattern) ?? []) {
    const attrs = parseTagAttributes(tag);
    const content = attrs.content;

    if (!content) {
      continue;
    }

    for (const key of preferredKeys) {
      if ((attrs[key.attr] ?? "").toLowerCase() === key.value) {
        candidates.push(content);
      }
    }
  }

  for (const candidate of candidates) {
    const resolved = resolveUrl(candidate, baseUrl);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

export async function fetchLinkPreviewImage(url: string): Promise<string | null> {
  let timeout: NodeJS.Timeout | undefined;

  try {
    const input = new URL(url);
    if (input.protocol !== "http:" && input.protocol !== "https:") {
      return null;
    }

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(input.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; EntrainLinkPreviewBot/1.0; +https://www.entrain.app)",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();

    if (contentType.startsWith("image/")) {
      return response.url;
    }

    if (!contentType.includes("text/html")) {
      return null;
    }

    const html = await response.text();
    return findMetaImageUrl(html, response.url);
  } catch {
    return null;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
