import Link from "next/link"

export const viewport = {
  themeColor: "#000000",
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Página no encontrada</p>
      <Link href="/" className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
        Volver al inicio
      </Link>
    </div>
  )
}
