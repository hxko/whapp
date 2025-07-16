// app/api/image-proxy/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get("url");

  console.log("➡️ Proxy request for:", imageUrl);

  if (!imageUrl) {
    console.warn("❌ Missing image URL");
    return new Response("Missing image URL", { status: 400 });
  }

  try {
    // Check if it's a YouTube domain and add appropriate headers
    const isYouTube =
      imageUrl.includes("youtube.com") ||
      imageUrl.includes("ytimg.com") ||
      imageUrl.includes("ggpht.com");

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36",
      Accept: "image/*",
    };

    if (isYouTube) {
      headers["Referer"] = "https://www.youtube.com/";
      headers["Origin"] = "https://www.youtube.com";
    }

    const res = await fetch(imageUrl, { headers });

    console.log("✅ Fetch status:", res.status);
    console.log("📦 Content-Type:", res.headers.get("content-type"));

    if (!res.ok) {
      console.error("❌ Failed to fetch image. Status:", res.status);
      return new Response("Upstream image fetch failed", {
        status: res.status,
      });
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("🔥 Proxy error:", error);
    return new Response("Failed to fetch image", { status: 500 });
  }
}
