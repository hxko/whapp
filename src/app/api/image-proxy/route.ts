// app/api/proxy/route.ts

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  try {
    // Special handling for YouTube
    if (url.includes("youtube.com/watch")) {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        url
      )}&format=json`;
      const ytRes = await fetch(oembedUrl);

      if (ytRes.ok) {
        const data = await ytRes.json();
        return new Response(
          JSON.stringify({
            title: data.title,
            description: `By ${data.author_name}`,
            images: [data.thumbnail_url],
            url,
            siteName: "YouTube",
            mediaType: "video",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // Fallback: fetch page and extract metadata (simplified example)
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    if (!pageRes.ok) {
      return new Response("Failed to fetch page", { status: 500 });
    }

    const html = await pageRes.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url;

    const imageMatch = html.match(
      /<meta property="og:image" content="([^"]+)"/i
    );
    const image = imageMatch ? imageMatch[1] : "";

    const descriptionMatch = html.match(
      /<meta name="description" content="([^"]+)"/i
    );
    const description = descriptionMatch ? descriptionMatch[1] : "";

    return new Response(
      JSON.stringify({
        title,
        description,
        images: image ? [image] : [],
        url,
        siteName: new URL(url).hostname,
        mediaType: "website",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response("Failed to fetch metadata", { status: 500 });
  }
}
