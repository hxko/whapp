// app/api/proxy/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
// Import the link-preview-js library - this is the main library that handles URL metadata extraction
// It can extract data from YouTube, Instagram, Twitter, regular websites, etc.
import { getLinkPreview } from "link-preview-js";

interface PreviewData {
  title: string;
  description: string;
  images: string[];
  url: string;
  siteName?: string;
  mediaType?: string;
}

interface LinkPreviewResponse {
  title?: string;
  description?: string;
  images?: string[];
  url?: string;
  siteName?: string;
  mediaType?: string;
}
// Type guard to check if the response has the properties we need
function isLinkPreviewResponse(
  response: unknown
): response is LinkPreviewResponse {
  return (
    typeof response === "object" && response !== null && "url" in response // Check for at least one required property
  );
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
    // HERE IS WHERE WE USE LINK-PREVIEW-JS:
    // This is the main function that extracts metadata from any URL
    // It handles special cases like YouTube, Instagram, Twitter automatically
    // and falls back to regular HTML parsing for other websites
    const previewData = await getLinkPreview(url, {
      headers: {
        // Set a realistic User-Agent to avoid being blocked by websites
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000, // Wait up to 10 seconds for response
      followRedirects: "follow", // Follow redirects (important for shortened URLs)
    });

    // Transform the data from link-preview-js format to your custom format
    // link-preview-js returns different property names, so we normalize them
    let transformedData: PreviewData;

    if (isLinkPreviewResponse(previewData)) {
      transformedData = {
        title: previewData.title || "No title available",
        description: previewData.description || "No description available",
        images: previewData.images || [],
        url: previewData.url || url,
        siteName: previewData.siteName,
        mediaType: previewData.mediaType,
      };
    } else {
      // Handle case where link-preview-js returns minimal data
      transformedData = {
        title: "No title available",
        description: "No description available",
        images: [],
        url: url,
        siteName: undefined,
        mediaType: undefined,
      };
    }

    return NextResponse.json(transformedData, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching link preview:", error);

    // FALLBACK: If link-preview-js fails, we fall back to your original HTML parsing
    // This might happen if the website blocks the library or has unusual formatting
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

      const htmlContent = await response.text();
      // Detect YouTube fallback
      if (htmlContent.includes("<title>YouTube</title>")) {
        console.error(
          "Fallback page detected. YouTube likely blocked this request."
        );
      }

      console.error("TRUNCATED HTML:", htmlContent.slice(0, 800)); // This will force logs to appear
      const previewData = parseHtmlForPreview(htmlContent, url);
      console.error("link-preview-js result:", previewData);
      return NextResponse.json(previewData, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (fallbackError) {
      console.error("Fallback parsing also failed:", fallbackError);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 }
      );
    }
  }
}

function parseHtmlForPreview(html: string, url: string): PreviewData {
  // BACKUP HTML PARSER: This is your original HTML parsing logic
  // This runs when link-preview-js fails or can't handle a particular website
  // It manually searches for Open Graph and Twitter meta tags in the HTML

  const getMetaContent = (property: string): string | null => {
    // Create different regex patterns to find meta tags with different formats
    // Some websites use property="og:title", others use name="og:title"
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

    // Try each pattern until we find a match
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getTitle = (): string => {
    // Try to get title from Open Graph first, then Twitter, then regular <title> tag
    return (
      getMetaContent("og:title") ||
      getMetaContent("twitter:title") ||
      (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] ||
      "No title available"
    );
  };

  const getDescription = (): string => {
    // Try to get description from various meta tag sources
    return (
      getMetaContent("og:description") ||
      getMetaContent("twitter:description") ||
      getMetaContent("description") ||
      "No description available"
    );
  };

  const getImages = (): string[] => {
    // Extract images from Open Graph and Twitter meta tags
    const images = [];
    const ogImage = getMetaContent("og:image");
    const twitterImage = getMetaContent("twitter:image");

    if (ogImage) images.push(ogImage);
    if (twitterImage && twitterImage !== ogImage) images.push(twitterImage);

    return images;
  };

  // Return the extracted data in your custom format
  return {
    title: getTitle().trim(),
    description: getDescription().trim(),
    images: getImages(),
    url: url,
  };
}
