import type { Metadata } from "next"
import ContactPage from "./contact-page"

export const metadata: Metadata = {
  title: "Contacto - Eventos de Música Electrónica | Ravehub",
  description: "Contáctanos para información sobre eventos, soporte técnico, colaboraciones o cualquier consulta sobre música electrónica en Latinoamérica. ¡Estamos aquí para ayudarte!",
  keywords: ["contacto Ravehub", "soporte eventos", "colaboraciones música electrónica", "ayuda rave", "comunidad electrónica"],
  openGraph: {
    title: "Contacto - Eventos de Música Electrónica | Ravehub",
    description: "Contáctanos para información sobre eventos, soporte técnico, colaboraciones o cualquier consulta sobre música electrónica en Latinoamérica.",
    images: ["/images/contact-og.png"],
    type: "website",
    url: "https://www.ravehublatam.com/contacto",
    siteName: "Ravehub",
  },
  twitter: {
    card: "summary",
    title: "Contacto - Eventos de Música Electrónica | Ravehub",
    description: "Contáctanos para información sobre eventos, soporte técnico, colaboraciones o cualquier consulta sobre música electrónica.",
  },
  alternates: {
    canonical: "https://www.ravehublatam.com/contacto",
  },
}

export default function ContactoPage() {
  return <ContactPage />
}
