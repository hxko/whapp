// app/api/proxy/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

interface PreviewData {
  title: string;
  description: string;
  images: string[];
  url: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  // Check if the URL is provided
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validate the URL
  try {
    new URL(url); // Validate URL format
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get HTML content instead of JSON
    const htmlContent = await response.text();

    // Parse HTML to extract preview data
    const previewData = parseHtmlForPreview(htmlContent, url);

    return NextResponse.json(previewData, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

function parseHtmlForPreview(html: string, url: string): PreviewData {
  // Basic regex-based HTML parsing (for production, consider using a proper HTML parser)
  const getMetaContent = (property: string): string | null => {
    const patterns = [
      new RegExp(
        `<meta\\s+property=["']${property}["']\\s+content=["']([^"']*?)["']`,
        "i"
      ),
      new RegExp(
        `<meta\\s+content=["']([^"']*?)["']\\s+property=["']${property}["']`,
        "i"
      ),
      new RegExp(
        `<meta\\s+name=["']${property}["']\\s+content=["']([^"']*?)["']`,
        "i"
      ),
      new RegExp(
        `<meta\\s+content=["']([^"']*?)["']\\s+name=["']${property}["']`,
        "i"
      ),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getTitle = (): string => {
    return (
      getMetaContent("og:title") ||
      getMetaContent("twitter:title") ||
      (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] ||
      "No title available"
    );
  };

  const getDescription = (): string => {
    return (
      getMetaContent("og:description") ||
      getMetaContent("twitter:description") ||
      getMetaContent("description") ||
      "No description available"
    );
  };

  const getImages = (): string[] => {
    const images = [];
    const ogImage = getMetaContent("og:image");
    const twitterImage = getMetaContent("twitter:image");

    if (ogImage) images.push(ogImage);
    if (twitterImage && twitterImage !== ogImage) images.push(twitterImage);

    return images;
  };

  return {
    title: getTitle().trim(),
    description: getDescription().trim(),
    images: getImages(),
    url: url,
  };
}
