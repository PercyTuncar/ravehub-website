"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Package, Clock, CheckCircle, AlertCircle, MapPin, CreditCard } from "lucide-react"
import type { Order, Product } from "@/types"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface OrderDetailsModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const [productImages, setProductImages] = useState<Record<string, string[]>>({})

  useEffect(() => {
    // Función para cargar las imágenes de los productos
    const loadProductImages = async () => {
      if (!isOpen) return

      const productIds = new Set<string>()

      // Recolectar todos los IDs de productos únicos
      order.orderItems.forEach((item) => {
        if (item.productId) {
          productIds.add(item.productId)
        }
      })

      // Cargar la información de cada producto
      const imagesMap: Record<string, string[]> = {}

      for (const productId of productIds) {
        try {
          const productDoc = await getDoc(doc(db, "products", productId))
          if (productDoc.exists()) {
            const productData = productDoc.data() as Product
            if (productData.images && productData.images.length > 0) {
              imagesMap[productId] = productData.images
            }
          }
        } catch (error) {
          console.error(`Error loading product ${productId}:`, error)
        }
      }

      setProductImages(imagesMap)
    }

    loadProductImages()
  }, [isOpen, order])
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Detalles del Pedido #{order.id.slice(0, 8)}</DialogTitle>
          <DialogDescription>Realizado el {formatDate(order.orderDate)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Order Status */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Estado del pedido</h3>
            <OrderStatusBadge status={order.status} />
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-medium mb-4">Productos</h3>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={
                        // Verificar si tenemos la imagen del producto cargada
                        item.productId && productImages[item.productId]?.length > 0
                          ? productImages[item.productId][0] // Usar la primera imagen del producto
                          : "/placeholder.svg?height=64&width=64"
                      }
                      alt={item.name || "Producto"}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Si la imagen falla, usar el placeholder
                        e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{item.name || "Producto"}</p>
                    {item.variantName && <p className="text-sm text-muted-foreground">{item.variantName}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.pricePerUnit.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-medium mb-2">Resumen</h3>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                ${(order.totalAmount - order.shippingCost).toFixed(2)} {order.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>
                ${order.shippingCost.toFixed(2)} {order.currency}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>
                ${order.totalAmount.toFixed(2)} {order.currency}
              </span>
            </div>
          </div>

          <Separator />

          {/* Shipping Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Dirección de envío
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p>Teléfono: {order.shippingAddress.phone}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <CreditCard className="h-4 w-4 mr-1" />
                Información de pago
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  Método de pago:{" "}
                  <span className="font-medium">
                    {order.paymentMethod === "online" ? "Pago online" : "Pago offline"}
                  </span>
                </p>
                {order.offlinePaymentMethod && (
                  <p>
                    Tipo: <span className="font-medium">{order.offlinePaymentMethod}</span>
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">Estado:</span>
                  <span>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "success"
                          : order.status === "shipping"
                            ? "info"
                            : order.status === "approved"
                              ? "default"
                              : order.status === "cancelled"
                                ? "destructive"
                                : "outline"
                      }
                    >
                      {order.status === "pending"
                        ? "Pendiente"
                        : order.status === "approved"
                          ? "Aprobado"
                          : order.status === "shipping"
                            ? "En camino"
                            : order.status === "delivered"
                              ? "Entregado"
                              : order.status === "cancelled"
                                ? "Cancelado"
                                : order.status}
                    </Badge>
                  </span>
                  <span className="font-medium">Pago:</span>
                  <span>
                    <Badge
                      variant={
                        order.paymentStatus === "approved"
                          ? "success"
                          : order.paymentStatus === "rejected"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {order.paymentStatus === "pending"
                        ? "Pendiente"
                        : order.paymentStatus === "approved"
                          ? "Aprobado"
                          : order.paymentStatus === "rejected"
                            ? "Rechazado"
                            : order.paymentStatus}
                    </Badge>
                  </span>
                </div>
                {order.paymentProofUrl && (
                  <div className="mt-2">
                    <p className="mb-1">Comprobante de pago:</p>
                    <div className="relative h-32 w-full rounded-md overflow-hidden bg-muted">
                      <Image
                        src={order.paymentProofUrl || "/placeholder.svg"}
                        alt="Comprobante de pago"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Notas adicionales</h3>
                <p className="text-sm">{order.notes}</p>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-700">
          <Clock className="h-3 w-3" />
          Pendiente
        </Badge>
      )
    case "processing":
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-700">
          <Package className="h-3 w-3" />
          En proceso
        </Badge>
      )
    case "completed":
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-700">
          <CheckCircle className="h-3 w-3" />
          Completado
        </Badge>
      )
    case "cancelled":
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-red-500 text-red-700">
          <AlertCircle className="h-3 w-3" />
          Cancelado
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
