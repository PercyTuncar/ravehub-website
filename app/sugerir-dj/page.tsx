import { SuggestDJForm } from "@/components/dj-ranking/suggest-dj-form"

export const metadata = {
  title: "Sugerir DJ | RaveHub",
  description: "Sugiere tus DJs favoritos para el ranking anual",
}

export const viewport = {
  themeColor: "#000000",
}

export default function SuggestDJPage() {
  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Sugerir DJ</h1>
        <p className="text-muted-foreground">
          Sugiere tus DJs favoritos para que sean incluidos en nuestro ranking anual. Cuantas más personas sugieran a un
          DJ, más posibilidades tendrá de ser aprobado.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <SuggestDJForm />
      </div>
    </div>
  )
}
