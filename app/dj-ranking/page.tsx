import { CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, ThumbsUp, Vote } from "lucide-react"

export const metadata = {
  title: "DJ Ranking | Ravehub",
  description: "Descubre, sugiere y vota por los mejores DJs de cada país",
}

export const viewport = {
  themeColor: "#000000",
}

export default function DJRankingPage() {
  return (
    <div className="container py-10 px-4 mx-auto">
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">DJ Ranking</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Descubre, sugiere y vota por los mejores DJs de cada país. Ayúdanos a crear el ranking definitivo de la escena
          electrónica.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ThumbsUp className="h-5 w-5 mr-2" /> Sugerir DJs
            </CardTitle>
            <CardDescription>Propón a tus DJs favoritos para que sean incluidos en el ranking.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p>
              ¿Conoces a un DJ que debería estar en nuestro ranking? Sugiere su nombre y ayuda a que sea reconocido.
              Cuantas más personas sugieran a un DJ, más posibilidades tendrá de ser aprobado.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/sugerir-dj">Sugerir DJ</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Vote className="h-5 w-5 mr-2" /> Votar
            </CardTitle>
            <CardDescription>Vota por tus 5 DJs favoritos para el ranking anual.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p>
              Tu opinión es importante. Vota por tus DJs favoritos y ayuda a determinar quiénes son los mejores de cada
              país. Puedes votar por hasta 5 DJs por año y país.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/votar">Votar ahora</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" /> Rankings
            </CardTitle>
            <CardDescription>Descubre los mejores DJs según los votos de la comunidad.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p>
              Explora los rankings de los mejores DJs por país y año. Conoce quiénes son los artistas más valorados por
              la comunidad y descubre nuevos talentos.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/top/peru/2023">Ver rankings</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="max-w-5xl mx-auto bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center mb-4">1</div>
            <h3 className="font-semibold mb-2">Sugerencia</h3>
            <p className="text-sm">Los usuarios sugieren DJs. El sistema registra la popularidad de cada sugerencia.</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center mb-4">2</div>
            <h3 className="font-semibold mb-2">Votación</h3>
            <p className="text-sm">Los usuarios votan por hasta 5 DJs por año y país durante el periodo de votación.</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center mb-4">3</div>
            <h3 className="font-semibold mb-2">Ranking</h3>
            <p className="text-sm">Al finalizar el periodo, se publica el ranking con los DJs más votados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
