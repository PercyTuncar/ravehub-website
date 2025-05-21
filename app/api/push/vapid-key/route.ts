import { NextResponse } from "next/server"

// This endpoint is deprecated, redirecting to the new one
export async function GET() {
  return NextResponse.redirect(new URL("/api/push/key", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"))
}
