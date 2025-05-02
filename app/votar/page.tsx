import { VoteDJForm } from "@/components/dj-ranking/vote-dj-form"

export const metadata = {
  title: "Votar por DJs | RaveHub",
  description: "Vota por tus DJs favoritos para el ranking anual",
}

export const viewport = {
  themeColor: "#000000",
}

export default function VotePage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Vota por tus DJs favoritos</h1>
        <p className="text-muted-foreground">
          Selecciona hasta 5 DJs para el ranking anual. Tu voto ayudará a determinar quiénes son los mejores DJs de cada
          país.
        </p>
      </div>

      <VoteDJForm />
    </div>
  )
}
