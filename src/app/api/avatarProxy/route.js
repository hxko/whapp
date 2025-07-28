// app/api/avatarProxy/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url"); // Get the URL from the query parameters

  // Damit niemand deinen Proxy missbraucht, kannst du die erlaubten Domains einschränken:
  const allowedDomains = [
    "lh3.googleusercontent.com",
    "avatars.githubusercontent.com",
  ];

  const parsed = new URL(url);
  if (!allowedDomains.includes(parsed.hostname)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const response = await fetch(url); // Use the native fetch API

    if (!response.ok) {
      throw new Error("Failed to fetch image");
    }

    const imageBuffer = await response.arrayBuffer(); // Get the image as an ArrayBuffer

    // Set the appropriate content type based on the response
    const contentType = response.headers.get("content-type");
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
