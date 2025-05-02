import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Read the service worker file from the public directory
    const filePath = path.join(process.cwd(), "public", "sw.js")
    const fileContents = fs.readFileSync(filePath, "utf8")

    // Return the file with the correct MIME type
    return new NextResponse(fileContents, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error serving service worker:", error)
    return new NextResponse("console.log('Service worker not found');", {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
      },
    })
  }
}
