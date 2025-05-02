"use client"

import { Suspense, useState } from "react"
import { ProductFilters } from "./product-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Componente de carga para los filtros de productos
function ProductFiltersSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full pt-6" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex justify-between pt-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductFiltersWrapper() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Versión de escritorio - se muestra como sidebar */}
      <div className="hidden md:block">
        <Suspense fallback={<ProductFiltersSkeleton />}>
          <ProductFilters />
        </Suspense>
      </div>

      {/* Versión móvil - se muestra como botón que abre un modal */}
      <div className="md:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filtros</DialogTitle>
            </DialogHeader>
            <Suspense fallback={<ProductFiltersSkeleton />}>
              <ProductFilters closeModal={() => setOpen(false)} />
            </Suspense>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
