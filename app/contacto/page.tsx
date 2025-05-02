import type { Metadata } from "next"
import ContactPage from "./contact-page"

export const metadata: Metadata = {
  title: "Contacto | RaveHub",
  description:
    "Contáctanos y conéctate con la comunidad RaveHub a través de nuestras redes sociales y grupos de WhatsApp.",
  openGraph: {
    title: "Contacto | RaveHub",
    description:
      "Contáctanos y conéctate con la comunidad RaveHub a través de nuestras redes sociales y grupos de WhatsApp.",
    images: ["/images/contact-og.png"],
  },
}

export default function ContactoPage() {
  return <ContactPage />
}
