import { NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with your API key (only if available)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { name, email, message } = await request.json()

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Nombre, correo y mensaje son requeridos" }, { status: 400 })
    }

    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Por favor ingresa un correo electrónico válido" }, { status: 400 })
    }

    // Check if Resend is configured
    if (!resend) {
      console.error("Resend API key not configured")
      return NextResponse.json({ error: "Servicio de email no configurado" }, { status: 500 })
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Contacto Ravehub <no-reply@weareravehub.com>",
      to: "percy@weareravehub.com",
      subject: `Nuevo mensaje de contacto de ${name}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Correo:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
      replyTo: email,
    })

    if (error) {
      console.error("Error sending email:", error)
      return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in contact form submission:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
