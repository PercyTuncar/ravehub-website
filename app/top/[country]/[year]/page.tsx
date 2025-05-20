import { DJRankingDisplay } from "@/components/dj-ranking/dj-ranking-display"

export const metadata = {
  title: "Top DJs | RaveHub",
  description: "Ranking de los mejores DJs por país y año",
}

export default function TopDJsPage() {
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
