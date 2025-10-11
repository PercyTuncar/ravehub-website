import type { Metadata } from "next"
import { DJRankingDisplay } from "@/components/dj-ranking/dj-ranking-display"

interface TopDJsPageProps {
  params: {
    country: string
    year: string
  }
}

export async function generateMetadata({ params }: TopDJsPageProps): Promise<Metadata> {
  const { country, year } = await params

  // Función para formatear el nombre del país
  const formatCountryName = (countryCode: string): string => {
    const countryNames: { [key: string]: string } = {
      'argentina': 'Argentina',
      'chile': 'Chile',
      'peru': 'Perú',
      'colombia': 'Colombia',
      'mexico': 'México',
      'ecuador': 'Ecuador',
      'uruguay': 'Uruguay',
      'paraguay': 'Paraguay',
      'bolivia': 'Bolivia',
      'venezuela': 'Venezuela',
      'brasil': 'Brasil',
      'españa': 'España',
      'portugal': 'Portugal',
      'usa': 'Estados Unidos',
      'uk': 'Reino Unido',
      'alemania': 'Alemania',
      'francia': 'Francia',
      'italia': 'Italia',
      'holanda': 'Holanda',
      'belgica': 'Bélgica',
      'suiza': 'Suiza',
      'austria': 'Austria',
      'suecia': 'Suecia',
      'noruega': 'Noruega',
      'dinamarca': 'Dinamarca',
      'finlandia': 'Finlandia',
    }
    return countryNames[countryCode.toLowerCase()] || countryCode.charAt(0).toUpperCase() + countryCode.slice(1)
  }

  const countryName = formatCountryName(country)
  const currentYear = new Date().getFullYear()
  const yearNum = parseInt(year)

  return {
    title: `Top DJs ${countryName} ${year} | Ravehub - Ranking Música Electrónica`,
    description: `Descubre el ranking de los mejores DJs de ${countryName} en ${year}. Votación de la comunidad rave para los artistas más destacados de música electrónica ${yearNum === currentYear ? 'actual' : `del ${year}`}.`,
    keywords: `top djs ${countryName}, ranking djs ${countryName} ${year}, mejores djs ${countryName}, música electrónica ${countryName}, djs ${year}`,
    openGraph: {
      title: `Top DJs ${countryName} ${year} | Ravehub`,
      description: `Ranking de los mejores DJs de ${countryName} en ${year}. Descubre quiénes son los artistas más votados por la comunidad rave.`,
      type: "website",
      url: `https://www.ravehublatam.com/top/${country}/${year}`,
    },
    twitter: {
      card: "summary",
      title: `Top DJs ${countryName} ${year} | Ravehub`,
      description: `Ranking de los mejores DJs de ${countryName} en ${year}.`,
    },
    alternates: {
      canonical: `https://www.ravehublatam.com/top/${country}/${year}`,
    },
  }
}

export default function TopDJsPage({ params }: TopDJsPageProps) {
  return (
    <div className="container py-10 px-4 mx-auto">
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Ranking de DJs</h1>
        <p className="text-muted-foreground">Descubre los mejores DJs de cada país según los votos de la comunidad.</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <DJRankingDisplay />
      </div>
    </div>
  )
}
