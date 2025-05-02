import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")

    // Verificar token de seguridad
    if (token !== process.env.REVALIDATE_TOKEN) {
      return NextResponse.json({ success: false, message: "Token inválido" }, { status: 401 })
    }

    // Revalidar el sitemap
    revalidatePath("/sitemap.xml")
    revalidatePath("/sitemap")

    console.log("Sitemap revalidated successfully:", new Date().toISOString())

    return NextResponse.json({
      revalidated: true,
      message: "Sitemap revalidated successfully",
      date: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error revalidating sitemap:", error)
    return NextResponse.json(
      { success: false, message: "Error revalidating sitemap", error: String(error) },
      { status: 500 },
    )
  }
}
