import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { subscription } = await request.json()

    // Process the subscription without referencing sensitive variables
    // Store the subscription in your database

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error registering push subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
