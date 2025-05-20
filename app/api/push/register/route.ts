import { NextResponse } from "next/server"
import { getFirestore } from "firebase-admin/firestore"
import { initAdmin } from "@/lib/firebase/firebase-admin"

// Inicializar Firebase Admin
initAdmin()

export async function POST(request: Request) {
  try {
    const { subscription } = await request.json()

    if (!subscription) {
      return NextResponse.json({ error: "No se proporcionó información de suscripción" }, { status: 400 })
    }

    // Guardar la suscripción en Firestore
    const db = getFirestore()
    await db.collection("push-subscriptions").add({
      subscription,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al registrar la suscripción push:", error)
    return NextResponse.json({ error: "Error al procesar la suscripción" }, { status: 500 })
  }
}
