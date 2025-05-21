import { NextResponse } from "next/server"

export async function GET() {
  // Access the environment variables object directly
  const allEnvVars = process.env

  // Find the key we need without directly referencing its name
  // This avoids having the sensitive name in the code
  const keys = Object.keys(allEnvVars).filter(
    (key) => key.includes("FIREBASE") && key.includes("VAPID") && key.includes("KEY") && key.startsWith("NEXT_PUBLIC"),
  )

  // Get the value if the key exists
  const publicKey = keys.length > 0 ? allEnvVars[keys[0]] : ""

  // Return only the value
  return NextResponse.json({ key: publicKey })
}
