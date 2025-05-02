import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    // Verificar la autenticación si es necesario
    const authHeader = request.headers.get("authorization")
    if (!authHeader || authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()

    // Registrar la actualización
    console.log("Webhook recibido para actualización de contenido:", body)

    // Revalidar el sitemap
    revalidatePath("/sitemap.xml")
    revalidatePath("/sitemap")

    return NextResponse.json({
      revalidated: true,
      message: "Sitemap revalidado correctamente después de actualización de contenido",
      date: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en webhook de actualización de contenido:", error)
    return NextResponse.json(
      { success: false, message: "Error al procesar webhook", error: String(error) },
      { status: 500 },
    )
  }
}
