import { SuggestDJForm } from "@/components/dj-ranking/suggest-dj-form"

export const metadata = {
  title: "Sugerir DJ | Ravehub",
  description: "Sugiere tus DJs favoritos para el ranking anual",
}

export const viewport = {
  themeColor: "#000000",
}

export default function SuggestDJPage() {
  return (
    <div className="container py-10 px-4 mx-auto">
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Sugerir DJ</h1>
        <p className="text-muted-foreground">
          Sugiere tus DJs favoritos para que sean incluidos en nuestro ranking anual. Cuantas más personas sugieran a un
          DJ, más posibilidades tendrá de ser aprobado.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <SuggestDJForm />
      </div>
    </div>
  )
}
