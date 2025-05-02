"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function EventsCategories() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentCategory = searchParams.get("category") || "all"

  const categories = [
    { id: "all", name: "Todos" },
    { id: "today", name: "Hoy" },
    { id: "this-week", name: "Esta semana" },
    { id: "music", name: "Música" },
    { id: "festival", name: "Festivales" },
  ]

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (categoryId === "all") {
      params.delete("category")
    } else {
      params.set("category", categoryId)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={currentCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategoryChange(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
