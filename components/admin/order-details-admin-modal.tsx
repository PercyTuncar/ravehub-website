"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { formatDate } from "@/lib/utils"
import { updateOrderStatus, updatePaymentStatus } from "@/lib/firebase/orders"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import type { Order } from "@/types"

interface OrderDetailsAdminModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order
  onSuccess?: () => void
}

export function OrderDetailsAdminModal({ isOpen, onClose, order, onSuccess }: OrderDetailsAdminModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("details")
  const [imageError, setImageError] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // State for updating order
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | undefined>(
    order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : undefined,
  )

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>
      case "approved":
        return <Badge variant="success">Aprobado</Badge>
      case "shipping":
        return <Badge variant="secondary">En camino</Badge>
      case "delivered":
        return <Badge variant="default">Entregado</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Get payment status badge variant
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>
      case "approved":
        return <Badge variant="success">Aprobado</Badge>
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Mejoro el manejo de errores en la función handleUpdateStatus

  // Handle update order status
  const handleUpdateStatus = async (status: "pending" | "approved" | "shipping" | "delivered" | "cancelled") => {
    if (!user) return

    try {
      setIsUpdating(true)

      // If status is shipping, require tracking number and expected delivery date
      if (status === "shipping" && (!trackingNumber || !expectedDeliveryDate)) {
        toast({
          title: "Error",
          description:
            "Para marcar como en camino, debes ingresar el número de seguimiento y la fecha estimada de entrega",
          variant: "destructive",
        })
        return
      }

      await updateOrderStatus(
        order.id,
        status,
        user.id,
        undefined,
        status === "shipping" ? trackingNumber : undefined,
        status === "shipping" ? expectedDeliveryDate : undefined,
      )

      toast({
        title: "Estado actualizado",
        description: "El estado del pedido ha sido actualizado exitosamente",
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating order status:", error)
      // Mostrar un mensaje de error más descriptivo
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? `Error al actualizar el estado: ${error.message}`
            : "Ocurrió un error al actualizar el estado del pedido",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Mejoro el manejo de errores en la función handleUpdatePaymentStatus

  // Handle update payment status
  const handleUpdatePaymentStatus = async (status: "pending" | "approved" | "rejected") => {
    if (!user) return

    try {
      setIsUpdating(true)
      await updatePaymentStatus(order.id, status, user.id)

      toast({
        title: "Estado de pago actualizado",
        description: "El estado del pago ha sido actualizado exitosamente",
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating payment status:", error)
      // Mostrar un mensaje de error más descriptivo
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? `Error al actualizar el estado del pago: ${error.message}`
            : "Ocurrió un error al actualizar el estado del pago",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Detalles del pedido</DialogTitle>
          <DialogDescription>
            Pedido #{order.id.substring(0, 8)} - {formatDate(order.orderDate)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="customer">Cliente</TabsTrigger>
            <TabsTrigger value="shipping">Envío</TabsTrigger>
            <TabsTrigger value="payment">Pago</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Estado del pedido</h3>
              {getStatusBadge(order.status)}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus("pending")}
                disabled={order.status === "pending" || isUpdating}
              >
                Pendiente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus("approved")}
                disabled={order.status === "approved" || isUpdating}
              >
                Aprobado
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus("shipping")}
                disabled={order.status === "shipping" || isUpdating}
              >
                En camino
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus("delivered")}
                disabled={order.status === "delivered" || isUpdating}
              >
                Entregado
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={order.status === "cancelled" || isUpdating}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                Cancelado
              </Button>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Productos</h3>
              <div className="space-y-3">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      {item.product?.images?.[0] && (
                        <Image
                          src={item.product.images[0] || "/placeholder.svg"}
                          alt={item.product?.name || "Producto"}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name || "Producto"}</p>
                      <p className="text-sm text-muted-foreground">
                        Cantidad: {item.quantity} x ${item.pricePerUnit.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(order.totalAmount - order.shippingCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>${order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {order.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-1">Notas del cliente</h3>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="customer" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Información del cliente</h3>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">
                  {order.user?.firstName} {order.user?.lastName}
                </p>
                <p>Email: {order.user?.email}</p>
                <p>
                  Teléfono: {order.user?.phonePrefix} {order.user?.phone}
                </p>
                <p>País: {order.user?.country}</p>
                <p>
                  Documento: {order.user?.documentType} {order.user?.documentNumber}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Dirección de envío</h3>
              <div className="bg-muted p-3 rounded-md">
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

            <div className="space-y-2">
              <Label htmlFor="trackingNumber">Número de seguimiento</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ingresa el número de seguimiento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">Fecha estimada de entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="expectedDeliveryDate"
                    variant="outline"
                    className={
                      expectedDeliveryDate ? "text-left font-normal" : "text-left font-normal text-muted-foreground"
                    }
                  >
                    {expectedDeliveryDate ? formatDate(expectedDeliveryDate) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                {/* Aquí iría el contenido del Popover para seleccionar fecha */}
              </Popover>
            </div>

            {order.trackingNumber && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Número de seguimiento actual</h3>
                <p className="bg-muted p-2 rounded-md">{order.trackingNumber}</p>
              </div>
            )}

            {order.expectedDeliveryDate && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Fecha estimada de entrega actual</h3>
                <p className="bg-muted p-2 rounded-md">{formatDate(order.expectedDeliveryDate)}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Estado del pago</h3>
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdatePaymentStatus("pending")}
                disabled={order.paymentStatus === "pending" || isUpdating}
              >
                Pendiente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdatePaymentStatus("approved")}
                disabled={order.paymentStatus === "approved" || isUpdating}
              >
                Aprobado
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdatePaymentStatus("rejected")}
                disabled={order.paymentStatus === "rejected" || isUpdating}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                Rechazado
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Método de pago</h3>
              <div className="bg-muted p-3 rounded-md">
                <p>
                  {order.paymentMethod === "online" ? "Pago en línea" : "Pago offline"}
                  {order.offlinePaymentMethod && (
                    <span className="ml-1">
                      (
                      {order.offlinePaymentMethod === "yape"
                        ? "Yape"
                        : order.offlinePaymentMethod === "plin"
                          ? "Plin"
                          : "Transferencia bancaria"}
                      )
                    </span>
                  )}
                </p>
              </div>
            </div>

            {order.paymentProofUrl && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Comprobante de pago</h3>
                <div className="relative h-40 w-full rounded-md overflow-hidden bg-muted">
                  {!imageError ? (
                    <Image
                      src={order.paymentProofUrl || "/placeholder.svg"}
                      alt="Comprobante de pago"
                      fill
                      className="object-contain"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Error al cargar la imagen</p>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                    Ver imagen completa
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
