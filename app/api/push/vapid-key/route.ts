import { NextResponse } from "next/server"

// Función para convertir la clave VAPID de base64 a Uint8Array y luego a formato adecuado
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = Buffer.from(base64, "base64")
  return new Uint8Array(rawData)
}

export async function GET() {
  try {
    // Obtener la clave VAPID del entorno del servidor
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ""

    if (!vapidKey) {
      return NextResponse.json({ error: "VAPID key no configurada" }, { status: 500 })
    }

    // Convertir la clave a formato adecuado para el cliente
    const publicKey = urlBase64ToUint8Array(vapidKey)

    // Devolver la clave pública en formato que el cliente pueda usar
    return NextResponse.json({ publicKey: publicKey })
  } catch (error) {
    console.error("Error al procesar la clave VAPID:", error)
    return NextResponse.json({ error: "Error al procesar la clave VAPID" }, { status: 500 })
  }
}
