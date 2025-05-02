import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-3xl font-bold mb-4">Producto no encontrado</h2>
      <p className="mb-8 text-gray-600">El producto que estás buscando no existe o ha sido eliminado.</p>
      <Button variant="default" asChild>
        <Link href="/tienda">Volver a la tienda</Link>
      </Button>
    </div>
  )
}
