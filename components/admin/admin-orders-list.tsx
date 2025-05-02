"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, FileText, Loader2, AlertTriangle } from "lucide-react"
import { getOrdersForAdmin } from "@/lib/firebase/orders"
import type { Order } from "@/types"
import { formatDate } from "@/lib/utils"
import { OrderDetailsAdminModal } from "@/components/admin/order-details-admin-modal"

export function AdminOrdersList() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)

        const adminOrders = await getOrdersForAdmin()
        setOrders(adminOrders)
      } catch (err) {
        console.error("Error fetching orders:", err)
        setError("Ocurrió un error al cargar los pedidos")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Filter orders based on search term and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.user?.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (order.user?.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handle view details
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }

  // Handle order update success
  const handleOrderUpdateSuccess = async () => {
    try {
      setLoading(true)
      const updatedOrders = await getOrdersForAdmin()
      setOrders(updatedOrders)
    } catch (error) {
      console.error("Error refreshing orders:", error)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="approved">Aprobados</SelectItem>
              <SelectItem value="shipping">En camino</SelectItem>
              <SelectItem value="delivered">Entregados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Cargando pedidos...</span>
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
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      {order.user?.firstName} {order.user?.lastName}
                    </TableCell>
                    <TableCell>{order.orderDate ? formatDate(order.orderDate) : "Fecha no disponible"}</TableCell>
                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Detalles</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No se encontraron pedidos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsAdminModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          order={selectedOrder}
          onSuccess={handleOrderUpdateSuccess}
        />
      )}
    </Card>
  )
}
