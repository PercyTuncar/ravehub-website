import { FakeDataGenerator } from "@/components/admin/fake-data-generator"

export const viewport = {
  themeColor: "#000000",
}

export default function FakeDataPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Generador de Datos Falsos</h1>
      <FakeDataGenerator />
    </div>
  )
}
