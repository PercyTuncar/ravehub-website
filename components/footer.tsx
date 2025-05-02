import Link from "next/link"
import { Facebook, Instagram, Phone, Mail, MessageSquare } from "lucide-react"

// Custom TikTok icon since it's not in Lucide by default
const TikTok = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4c0-1.1.9-2 2-2h2" />
    <path d="M12 16a4 4 0 0 1-4 4" />
    <path d="M21 8v2a4 4 0 0 1-4 4" />
  </svg>
)

// Add structured data for organization
const OrganizationSchema = () => {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RaveHub",
    url: "https://ravehublatam.com",
    logo: "https://ravehublatam.com/images/logo-full.png",
    sameAs: [
      "https://www.facebook.com/ravehub",
      "https://www.instagram.com/ravehub.pe",
      "https://www.tiktok.com/@ravehub.pe",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+51944784488",
        contactType: "customer service",
        areaServed: "PE",
      },
      {
        "@type": "ContactPoint",
        telephone: "+56944324385",
        contactType: "customer service",
        areaServed: "CL",
      },
      {
        "@type": "ContactPoint",
        email: "info@ravehublatam.com",
        contactType: "customer service",
      },
    ],
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
}

export default function Footer() {
  return (
    <footer className="bg-background border-t" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">RaveHub</h3>
            <p className="text-muted-foreground mb-4">
              La plataforma líder en eventos de música electrónica en Latinoamérica. Conectamos a los amantes de la
              música electrónica con los mejores eventos, artistas y experiencias.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.facebook.com/ravehub"
                className="text-muted-foreground hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="https://www.instagram.com/ravehub.pe"
                className="text-muted-foreground hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="https://www.tiktok.com/@ravehub.pe"
                className="text-muted-foreground hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <TikTok />
                <span className="sr-only">TikTok</span>
              </Link>
              <Link
                href="https://linktr.ee/Grupo__WhatsApp"
                className="text-muted-foreground hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Groups"
              >
                <MessageSquare size={20} />
                <span className="sr-only">Grupos de WhatsApp</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/eventos" className="text-muted-foreground hover:text-primary transition-colors">
                  Eventos
                </Link>
              </li>
              <li>
                <Link href="/tienda" className="text-muted-foreground hover:text-primary transition-colors">
                  Tienda
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/galeria" className="text-muted-foreground hover:text-primary transition-colors">
                  Galería
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-muted-foreground hover:text-primary transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Soporte</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/ayuda" className="text-muted-foreground hover:text-primary transition-colors">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-muted-foreground hover:text-primary transition-colors">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-muted-foreground hover:text-primary transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/reembolsos" className="text-muted-foreground hover:text-primary transition-colors">
                  Política de reembolsos
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Contacto</h3>
            <address className="not-italic text-muted-foreground space-y-2">
              <p className="flex items-center gap-2">
                <Mail size={16} className="flex-shrink-0" />
                <a href="mailto:info@ravehublatam.com" className="hover:text-primary transition-colors">
                  info@ravehublatam.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="flex-shrink-0" />
                <a href="tel:+51944784488" className="hover:text-primary transition-colors">
                  +51 944 784 488 (Perú)
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="flex-shrink-0" />
                <a href="tel:+56944324385" className="hover:text-primary transition-colors">
                  +56 944 324 385 (Chile)
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MessageSquare size={16} className="flex-shrink-0" />
                <a
                  href="https://linktr.ee/Grupo__WhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Grupos de WhatsApp
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RaveHub. Todos los derechos reservados.</p>
        </div>
      </div>
      <OrganizationSchema />
    </footer>
  )
}
