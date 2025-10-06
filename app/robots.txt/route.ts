import { NextResponse } from "next/server"

// Dominio base del sitio
const SITE_URL = "https://weareravehub.com"

export async function GET() {
  // Contenido del archivo robots.txt
  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Host
Host: ${SITE_URL}

# Directorios específicos que no deben ser indexados
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /404
Disallow: /500
`

  // Devolver la respuesta con el tipo de contenido correcto
  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache de 1 hora
    },
  })
}
