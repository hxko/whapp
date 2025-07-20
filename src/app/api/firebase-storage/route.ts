import { NextRequest, NextResponse } from "next/server";
import { getStorage, ref, getBytes } from "firebase/storage";
import { getApp } from "firebase/app"; // Import getApp to access the initialized app

// Get the initialized Firebase app
const app = getApp(); // This will get the already initialized app instance
const storage = getStorage(app); // Initialize storage with the app instance

// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://whapp-nine.vercel.app",
];

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join("/");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    const fileRef = ref(storage, filePath);

    try {
      const bytes = await getBytes(fileRef);
      const contentType = getContentType(filePath);

      const response = new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": getOrigin(request), // Set dynamic origin
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });

      return response;
    } catch (firebaseError: any) {
      if (firebaseError.code === "storage/object-not-found") {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      console.error("Firebase Storage error:", firebaseError);
      return NextResponse.json(
        { error: "Failed to retrieve file from storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": getOrigin(request), // Set dynamic origin
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// Helper function to determine the origin
function getOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  if (allowedOrigins.includes(origin || "")) {
    return origin || ""; // Return the origin if it's allowed
  }
  return ""; // Return empty string if the origin is not allowed
}

// Helper function to determine content type based on file extension
function getContentType(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase();

  const contentTypes: { [key: string]: string } = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    txt: "text/plain",
    json: "application/json",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip",
  };

  return contentTypes[extension || ""] || "application/octet-stream";
}
