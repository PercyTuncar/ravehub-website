"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { OrderDetailsModal } from "@/components/store/order-details-modal"
import { getUserOrders } from "@/lib/firebase/orders"
import { formatDate } from "@/lib/utils"
import { Package, ShoppingBag, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import type { Order, Product } from "@/types"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export function UserOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return

      try {
        setLoading(true)
        const userOrders = await getUserOrders(user.id)
        setOrders(userOrders)
      } catch (error) {
        console.error("Error fetching user orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inicia sesión para ver tus compras</CardTitle>
          <CardDescription>Necesitas iniciar sesión para ver tu historial de compras</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/login?redirect=/perfil/compras">Iniciar sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No tienes compras</CardTitle>
          <CardDescription>Aún no has realizado ninguna compra en nuestra tienda</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/tienda">Ir a la tienda</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="processing">En proceso</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <OrdersList orders={orders} onViewDetails={openOrderDetails} />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <OrdersList orders={orders.filter((order) => order.status === "pending")} onViewDetails={openOrderDetails} />
        </TabsContent>

        <TabsContent value="processing" className="mt-6">
          <OrdersList
            orders={orders.filter((order) => order.status === "processing")}
            onViewDetails={openOrderDetails}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <OrdersList
            orders={orders.filter((order) => order.status === "completed")}
            onViewDetails={openOrderDetails}
          />
        </TabsContent>
      </Tabs>

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}

interface OrdersListProps {
  orders: Order[]
  onViewDetails: (order: Order) => void
}

function OrdersList({ orders, onViewDetails }: OrdersListProps) {
  const [productImages, setProductImages] = useState<Record<string, string[]>>({})

  useEffect(() => {
    // Función para cargar las imágenes de los productos
    const loadProductImages = async () => {
      const productIds = new Set<string>()

      // Recolectar todos los IDs de productos únicos
      orders.forEach((order) => {
        order.orderItems.forEach((item) => {
          if (item.productId) {
            productIds.add(item.productId)
          }
        })
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

    if (orders.length > 0) {
      loadProductImages()
    }
  }, [orders])

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No hay pedidos en esta categoría</h3>
          <p className="text-muted-foreground mt-1">No se encontraron pedidos que coincidan con este filtro</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                <CardDescription>{formatDate(order.orderDate)}</CardDescription>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
          </CardHeader>

          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-4">
              {order.orderItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
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
                  <div>
                    <p className="font-medium line-clamp-1">{item.product?.name || "Producto"}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {item.quantity} × ${item.pricePerUnit.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              {order.orderItems.length > 3 && (
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-muted">
                  <span className="text-sm font-medium">+{order.orderItems.length - 3} más</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold">
                  ${order.totalAmount.toFixed(2)} {order.currency}
                </p>
              </div>
              <Button onClick={() => onViewDetails(order)}>Ver detalles</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
