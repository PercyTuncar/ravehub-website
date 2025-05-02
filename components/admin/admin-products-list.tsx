"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Search, Edit, Trash, Eye, AlertTriangle, Loader2, Upload } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getProductsForAdmin, deleteProduct, getAllCategories } from "@/lib/firebase/products"
import type { Product, ProductCategory } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { ImportProductsModal } from "@/components/admin/import-products-modal"
import { ProductTemplateDownload } from "@/components/admin/product-template-download"

export function AdminProductsList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [adminProducts, allCategories] = await Promise.all([getProductsForAdmin(), getAllCategories()])
        setProducts(adminProducts)
        setCategories(allCategories)
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Ocurrió un error al cargar los productos")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter products based on search term, category, and status
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.isActive) ||
      (statusFilter === "inactive" && !product.isActive)

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Handle delete product
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return

    try {
      setIsDeleting(true)
      await deleteProduct(productToDelete.id)

      // Update products list
      setProducts(products.filter((p) => p.id !== productToDelete.id))

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el producto",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  // Handle import complete
  const handleImportComplete = async () => {
    try {
      setLoading(true)
      const adminProducts = await getProductsForAdmin()
      setProducts(adminProducts)
      toast({
        title: "Productos actualizados",
        description: "La lista de productos ha sido actualizada",
      })
    } catch (error) {
      console.error("Error refreshing products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Sin categoría"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de productos</CardTitle>
        <div className="flex gap-2">
          <ProductTemplateDownload />
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            <span>Importar JSON</span>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Nuevo producto</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Cargando productos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-red-500">
                    <div className="flex justify-center items-center">
                      <AlertTriangle className="h-6 w-6 mr-2" />
                      <span>{error}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>
                      {product.discountPercentage ? (
                        <div>
                          <span className="line-through text-muted-foreground">${product.price.toFixed(2)}</span>
                          <span className="ml-2 font-medium">
                            ${(product.price * (1 - product.discountPercentage / 100)).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span>${product.price.toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.hasVariants ? "Sí" : "No"}</TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/tienda/${product.slug}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteClick(product)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el producto "{productToDelete?.name}". Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Products Modal */}
      <ImportProductsModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </Card>
  )
}
