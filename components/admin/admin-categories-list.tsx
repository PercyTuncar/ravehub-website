"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { getAllCategories, updateCategory, deleteCategory } from "@/lib/firebase/products"
import { Plus, Search, MoreVertical, Edit, Trash, ArrowUpDown, Loader2 } from "lucide-react"
import type { ProductCategory } from "@/types"
import Image from "next/image"

export function AdminCategoriesList() {
  const router = useRouter()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProductCategory; direction: "asc" | "desc" }>({
    key: "order",
    direction: "asc",
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const data = await getAllCategories()
        setCategories(data)
        setFilteredCategories(data)
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCategories(categories)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(query) ||
          category.description?.toLowerCase().includes(query) ||
          category.slug.toLowerCase().includes(query),
      )
      setFilteredCategories(filtered)
    }
  }, [searchQuery, categories])

  // Handle sort
  const handleSort = (key: keyof ProductCategory) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })

    const sortedCategories = [...filteredCategories].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1
      return 0
    })
    setFilteredCategories(sortedCategories)
  }

  // Toggle category active status
  const toggleCategoryStatus = async (id: string, isActive: boolean) => {
    try {
      await updateCategory(id, { isActive })
      setCategories(categories.map((category) => (category.id === id ? { ...category, isActive } : category)))
      setFilteredCategories(
        filteredCategories.map((category) => (category.id === id ? { ...category, isActive } : category)),
      )
      toast({
        title: "Estado actualizado",
        description: `La categoría ha sido ${isActive ? "activada" : "desactivada"}`,
      })
    } catch (error) {
      console.error("Error updating category status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la categoría",
        variant: "destructive",
      })
    }
  }

  // Delete category
  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.")) {
      try {
        setDeletingId(id)
        await deleteCategory(id)
        setCategories(categories.filter((category) => category.id !== id))
        setFilteredCategories(filteredCategories.filter((category) => category.id !== id))
        toast({
          title: "Categoría eliminada",
          description: "La categoría ha sido eliminada exitosamente",
        })
      } catch (error) {
        console.error("Error deleting category:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar la categoría",
          variant: "destructive",
        })
      } finally {
        setDeletingId(null)
      }
    }
  }

  // Add a function to get parent category name
  const getParentCategoryName = (parentId: string) => {
    const parent = categories.find((c) => c.id === parentId)
    return parent ? parent.name : "N/A"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categorías de Productos</CardTitle>
        <Button onClick={() => router.push("/admin/categories/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorías..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron categorías</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Nombre
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("order")}>
                    <div className="flex items-center">
                      Orden
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>SEO</TableHead>
                  <TableHead>Categoría Padre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.imageUrl ? (
                        <div className="relative h-10 w-10 rounded-md overflow-hidden">
                          <Image
                            src={category.imageUrl || "/placeholder.svg"}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">N/A</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">{category.slug}</div>
                    </TableCell>
                    <TableCell>{category.order}</TableCell>
                    <TableCell>
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={(checked) => toggleCategoryStatus(category.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      {category.seoTitle ||
                      category.seoDescription ||
                      (category.seoKeywords && category.seoKeywords.length > 0) ? (
                        <Badge variant="outline" className="bg-green-50">
                          Optimizado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50">
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.isSubcategory ? getParentCategoryName(category.parentCategoryId || "") : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      {deletingId === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/categories/${category.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
