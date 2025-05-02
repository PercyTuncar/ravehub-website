import Link from "next/link"

export default function AuthorNotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-6">Autor no encontrado</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        El autor que estás buscando no existe o no está disponible.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/team" className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
          Ver equipo completo
        </Link>
        <Link
          href="/"
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
