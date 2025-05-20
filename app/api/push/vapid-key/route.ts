import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Obtener la clave VAPID pública desde las variables de entorno
    const vapidPublicKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

    if (!vapidPublicKey) {
      return NextResponse.json({ error: "La clave VAPID pública no está configurada" }, { status: 500 })
    }

    // Devolver la clave pública
    return NextResponse.json({ vapidPublicKey })
  } catch (error) {
    console.error("Error al obtener la clave VAPID:", error)
    return NextResponse.json({ error: "Error al obtener la clave VAPID" }, { status: 500 })
  }
}
