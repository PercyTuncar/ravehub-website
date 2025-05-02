"use client"

import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Category {
  id: string
  name: string
  slug: string
}

interface CategorySelectProps {
  selectedCategories: string[]
  onChange: (categories: string[]) => void
}

export function CategorySelect({ selectedCategories, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesCollection = collection(db, "blogCategories")
        const categorySnapshot = await getDocs(categoriesCollection)
        const categoryList = categorySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Category,
        )

        setCategories(categoryList)
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedCategories, categoryId])
    } else {
      onChange(selectedCategories.filter((id) => id !== categoryId))
    }
  }

  if (loading) {
    return <div>Cargando categorías...</div>
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
      {categories.length > 0 ? (
        categories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${category.id}`}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
            />
            <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">No hay categorías disponibles</p>
      )}
    </div>
  )
}
