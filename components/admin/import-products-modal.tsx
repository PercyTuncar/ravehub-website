"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react"
import { importProductsFromJSON, createCategory } from "@/lib/firebase/products"
import { toast } from "@/components/ui/use-toast"
import { validateProducts } from "@/lib/validation/product-schema"
import { ProductTemplateDownload } from "@/components/admin/product-template-download"

interface ImportProductsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function ImportProductsModal({ open, onOpenChange, onImportComplete }: ImportProductsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    products?: any[]
    errors?: string[]
  } | null>(null)
  const [importResult, setImportResult] = useState<{
    success: boolean
    imported: number
    errors: { product: string; error: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<{ message?: string; error?: string }>({})

  // Mejorar el manejo de categorías y subcategorías durante la importación

  // Add this function to handle category imports
  const importCategories = async (categories: any[]) => {
    if (!categories || categories.length === 0) return

    try {
      setImportStatus((prev) => ({ ...prev, message: "Importando categorías..." }))

      // Primero, filtrar y validar las categorías
      const validCategories = categories.filter((cat) => {
        // Verificar si es una categoría principal o subcategoría
        if (
          cat.isSubcategory &&
          (!cat.parentCategoryId || cat.parentCategoryId === "REPLACE_WITH_PARENT_CATEGORY_ID")
        ) {
          setImportStatus((prev) => ({
            ...prev,
            error: `La subcategoría "${cat.name}" tiene un parentCategoryId inválido. Debe proporcionar un ID real.`,
          }))
          return false
        }

        // Verificar otros campos requeridos
        if (!cat.name || !cat.slug) {
          setImportStatus((prev) => ({
            ...prev,
            error: `Categoría inválida: falta nombre o slug`,
          }))
          return false
        }

        return true
      })

      // First, import parent categories
      const parentCategories = validCategories.filter((cat) => !cat.isSubcategory)
      const createdCategoryIds = new Map() // Para almacenar los IDs de categorías creadas

      for (const category of parentCategories) {
        const categoryId = await createCategory({
          ...category,
          isSubcategory: false,
          parentCategoryId: "",
          subcategories: [],
        })

        // Guardar el ID para referencia posterior
        createdCategoryIds.set(category.name, categoryId)
      }

      // Then import subcategories
      const subcategories = validCategories.filter((cat) => cat.isSubcategory)
      for (const subcategory of subcategories) {
        await createCategory({
          ...subcategory,
          isSubcategory: true,
        })
      }

      setImportStatus((prev) => ({
        ...prev,
        message: `Categorías importadas: ${validCategories.length}`,
      }))

      return createdCategoryIds
    } catch (error) {
      console.error("Error importing categories:", error)
      setImportStatus((prev) => ({
        ...prev,
        error: "Error al importar categorías: " + (error instanceof Error ? error.message : String(error)),
      }))
      return null
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/json") {
        toast({
          title: "Formato incorrecto",
          description: "Por favor, selecciona un archivo JSON",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
      setValidationResult(null)
      setImportResult(null)
    }
  }

  const validateFile = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Leer el archivo
      const text = await file.text()
      setUploadProgress(30)

      // Parsear el JSON
      const jsonData = JSON.parse(text)
      setUploadProgress(40)

      // Eliminar las instrucciones si existen
      if (jsonData._instructions) {
        delete jsonData._instructions
      }

      // Check if there are categories to import
      if (jsonData.categories && Array.isArray(jsonData.categories)) {
        const categoryIds = await importCategories(jsonData.categories)

        // Si tenemos IDs de categorías creadas y productos, actualizar los categoryId en los productos
        if (categoryIds && jsonData.products && Array.isArray(jsonData.products)) {
          jsonData.products = jsonData.products.map((product) => {
            // Si el producto tiene un categoryId de ejemplo y tenemos una categoría con ese nombre
            if (product.categoryId === "REPLACE_WITH_ACTUAL_CATEGORY_ID" && product.categoryName) {
              const categoryId = categoryIds.get(product.categoryName)
              if (categoryId) {
                product.categoryId = categoryId
              }
            }
            return product
          })
        }
      }

      // Validar la estructura
      if (!jsonData.products || !Array.isArray(jsonData.products)) {
        setValidationResult({
          valid: false,
          errors: ["El archivo debe contener un array 'products'"],
        })
        return
      }

      setUploadProgress(50)

      // Validar cada producto usando nuestro esquema de validación
      const validation = validateProducts(jsonData.products)

      setUploadProgress(80)

      if (validation.valid) {
        setValidationResult({
          valid: true,
          products: validation.validProducts,
        })
      } else {
        // Formatear los errores para mostrarlos
        const errors: string[] = []
        validation.invalidProducts.forEach((item, index) => {
          errors.push(`Producto #${index + 1} (${item.product.name || "Sin nombre"}):`)
          item.errors.forEach((error) => {
            errors.push(`  - ${error}`)
          })
        })

        setValidationResult({
          valid: false,
          errors,
          invalidProducts: validation.invalidProducts,
          validProducts: validation.validProducts,
        })
      }

      setUploadProgress(100)
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: ["Error al procesar el archivo: " + (error instanceof Error ? error.message : String(error))],
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = async () => {
    if (!validationResult?.valid || !validationResult.products) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Importar productos
      const result = await importProductsFromJSON(validationResult.products, (progress) => {
        setUploadProgress(progress)
      })

      setImportResult(result)

      if (result.success) {
        toast({
          title: "Importación completada",
          description: `Se importaron ${result.imported} productos correctamente`,
        })

        // Esperar un momento y cerrar el modal
        setTimeout(() => {
          onOpenChange(false)
          onImportComplete()
        }, 2000)
      } else {
        toast({
          title: "Importación completada con errores",
          description: `Se importaron ${result.imported} productos. Hubo ${result.errors.length} errores.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error en la importación",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setValidationResult(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Productos desde JSON</DialogTitle>
          <DialogDescription>
            Sube un archivo JSON con la estructura correcta para importar productos en masa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {importStatus.message && (
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>Import Status</AlertTitle>
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}

          {importStatus.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Import Error</AlertTitle>
              <AlertDescription>{importStatus.error}</AlertDescription>
            </Alert>
          )}

          {!validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ProductTemplateDownload />
              </div>

              <div className="flex items-center gap-4">
                <input type="file" accept=".json" onChange={handleFileChange} className="flex-1" ref={fileInputRef} />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>

              {file && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Archivo seleccionado</AlertTitle>
                  <AlertDescription>
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {validationResult && !validationResult.valid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error de validación</AlertTitle>
              <AlertDescription>
                <div className="mt-2 max-h-60 overflow-y-auto">
                  <ul className="list-disc pl-5 space-y-1">
                    {validationResult.errors?.map((error, index) => (
                      <li key={index} className={error.startsWith("Producto") ? "font-semibold mt-2" : "ml-2"}>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
                {validationResult.validProducts && validationResult.validProducts.length > 0 && (
                  <p className="mt-4">
                    Se encontraron {validationResult.validProducts.length} productos válidos que pueden ser importados.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {validationResult && validationResult.valid && (
            <Alert variant="default" className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Validación exitosa</AlertTitle>
              <AlertDescription>
                Se encontraron {validationResult.products?.length} productos válidos listos para importar.
              </AlertDescription>
            </Alert>
          )}

          {importResult && (
            <Alert
              variant={importResult.errors.length > 0 ? "default" : "default"}
              className={importResult.errors.length > 0 ? "border-yellow-500" : "border-green-500"}
            >
              <CheckCircle
                className={`h-4 w-4 ${importResult.errors.length > 0 ? "text-yellow-500" : "text-green-500"}`}
              />
              <AlertTitle>Resultado de la importación</AlertTitle>
              <AlertDescription>
                <p>Se importaron {importResult.imported} productos correctamente.</p>
                {importResult.errors.length > 0 && (
                  <>
                    <p className="mt-2 font-medium">Errores ({importResult.errors.length}):</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>
                          <span className="font-medium">{error.product}:</span> {error.error}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!validationResult && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={validateFile} disabled={!file || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  "Validar"
                )}
              </Button>
            </>
          )}

          {validationResult && !validationResult.valid && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reintentar
              </Button>
            </>
          )}

          {validationResult && validationResult.valid && !importResult && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cambiar archivo
              </Button>
              <Button onClick={handleImport} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Importar productos"
                )}
              </Button>
            </>
          )}

          {importResult && <Button onClick={() => onOpenChange(false)}>Cerrar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
