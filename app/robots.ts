import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/perfil/",
        "/login",
        "/registro",
        "/recuperar-password",
        "/restablecer-password",
        "/completar-registro",
      ],
    },
    sitemap: "https://www.ravehublatam.com/sitemap.xml",
    host: "https://www.ravehublatam.com",
  }
}
