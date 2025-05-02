import { NextResponse } from "next/server"

// This function runs on the server, so it's safe to use environment variables here
export async function GET() {
  try {
    const apiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY // Note: no NEXT_PUBLIC_ prefix

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}`)
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Failed to fetch exchange rates" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching exchange rates:", error)
    return NextResponse.json({ error: "Failed to fetch exchange rates" }, { status: 500 })
  }
}
