"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, CheckCircle, XCircle, FileText, Loader2, AlertTriangle } from "lucide-react"
import {
  getPendingTicketTransactions,
  rejectTicketTransaction,
  getPaidTicketTransactions,
} from "@/lib/firebase/tickets"
import type { TicketTransaction } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { TicketDetailsModal } from "@/components/admin/ticket-details-modal"
import { ApproveTicketModal } from "@/components/admin/approve-ticket-modal"
import { formatDate } from "@/lib/utils"

// Añadir el import para el modal de asignación de tickets
import { AssignTicketModal } from "@/components/admin/assign-ticket-modal"

// Modificar los imports para añadir los componentes de paginación
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function AdminTicketsList() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")

  const [transactions, setTransactions] = useState<TicketTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedTransaction, setSelectedTransaction] = useState<TicketTransaction | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  // Agregar una nueva pestaña para tickets pagados en su totalidad
  const [paidTransactions, setPaidTransactions] = useState<TicketTransaction[]>([])

  // Añadir el estado para controlar la visibilidad del modal de asignación
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  // Modificar el estado para manejar la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Estados para la caché en memoria
  const [cachedPendingTransactions, setCachedPendingTransactions] = useState<TicketTransaction[]>([])
  const [cachedPaidTransactions, setCachedPaidTransactions] = useState<TicketTransaction[]>([])
  const [lastCacheUpdate, setLastCacheUpdate] = useState<Date | null>(null)
  const [isCacheExpired, setIsCacheExpired] = useState(false)
  const CACHE_EXPIRATION_TIME = 5 * 60 * 1000 // 5 minutos en milisegundos

  // Fetch transactions and implement memory caching
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)

        // Verificar si hay datos en caché y si la caché no ha expirado
        const now = new Date()
        const cacheIsValid =
          lastCacheUpdate && now.getTime() - lastCacheUpdate.getTime() < CACHE_EXPIRATION_TIME && !isCacheExpired

        if (cacheIsValid) {
          console.log("Usando datos en caché")

          // Usar datos en caché
          if (statusFilter === "paid") {
            setTransactions([])
            setPaidTransactions(cachedPaidTransactions)
          } else if (statusFilter === "all") {
            setTransactions(cachedPendingTransactions)
            setPaidTransactions(cachedPaidTransactions)
          } else {
            // Filtrar por estado específico (pending, approved, rejected)
            const filteredTx = cachedPendingTransactions.filter((tx) => tx.paymentStatus === statusFilter)
            setTransactions(filteredTx)
            setPaidTransactions([])
          }

          setLoading(false)
          return
        }

        // Si no hay caché válida, cargar desde Firebase con límites
        console.log("Cargando datos desde Firebase")

        // Cargar solo los datos necesarios según el filtro actual
        // Limitar a 100 registros por consulta para mejorar rendimiento
        const QUERY_LIMIT = 100

        let pendingTx: TicketTransaction[] = []
        let paidTx: TicketTransaction[] = []

        // Cargar solo los datos necesarios según el filtro actual
        if (statusFilter === "paid" || statusFilter === "all") {
          paidTx = await getPaidTicketTransactions(QUERY_LIMIT)
        }

        if (statusFilter !== "paid") {
          pendingTx = await getPendingTicketTransactions(QUERY_LIMIT)
        }

        // Guardar en caché
        setCachedPendingTransactions(pendingTx)
        setCachedPaidTransactions(paidTx)
        setLastCacheUpdate(new Date())
        setIsCacheExpired(false)

        // Establecer datos actuales según el filtro
        if (statusFilter === "paid") {
          setTransactions([])
          setPaidTransactions(paidTx)
        } else if (statusFilter === "all") {
          setTransactions(pendingTx)
          setPaidTransactions(paidTx)
        } else {
          // Filtrar por estado específico (pending, approved, rejected)
          const filteredTx = pendingTx.filter((tx) => tx.paymentStatus === statusFilter)
          setTransactions(filteredTx)
          setPaidTransactions([])
        }

        // Calcular paginación
        const totalItems =
          statusFilter === "paid"
            ? paidTx.length
            : statusFilter === "all"
              ? pendingTx.length + paidTx.length
              : pendingTx.filter((tx) => tx.paymentStatus === statusFilter).length

        setTotalPages(Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)))
      } catch (err) {
        console.error("Error al cargar transacciones:", err)
        setError("Ocurrió un error al cargar las transacciones. Por favor, intente nuevamente.")
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [isCacheExpired, statusFilter])

  // Manejar cambio de página y filtros usando datos en caché
  useEffect(() => {
    if (!lastCacheUpdate) return // Esperar a que se carguen los datos iniciales

    setLoading(true)

    try {
      // Filtrar datos según el estado seleccionado
      if (statusFilter === "paid") {
        // Mostrar solo transacciones pagadas
        setTransactions([])
        setPaidTransactions(cachedPaidTransactions)
        setTotalPages(Math.max(1, Math.ceil(cachedPaidTransactions.length / ITEMS_PER_PAGE)))
      } else if (statusFilter === "all") {
        // Mostrar todas las transacciones
        setTransactions(cachedPendingTransactions)
        setPaidTransactions(cachedPaidTransactions)
        const totalItems = cachedPendingTransactions.length + cachedPaidTransactions.length
        setTotalPages(Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)))
      } else {
        // Filtrar por estado específico (pending, approved, rejected)
        const filteredTx = cachedPendingTransactions.filter((tx) => tx.paymentStatus === statusFilter)
        setTransactions(filteredTx)
        setPaidTransactions([])
        setTotalPages(Math.max(1, Math.ceil(filteredTx.length / ITEMS_PER_PAGE)))
      }
    } catch (err) {
      console.error("Error al filtrar transacciones:", err)
      toast({
        title: "Error",
        description: "No se pudieron filtrar los tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, lastCacheUpdate, cachedPendingTransactions, cachedPaidTransactions])

  // Función para forzar la recarga de datos desde Firebase
  const refreshData = () => {
    setIsCacheExpired(true)
  }

  // Filter and paginate transactions in memory
  const filteredTransactions = useMemo(() => {
    let result: TicketTransaction[] = []

    // Seleccionar el conjunto de datos correcto según el filtro
    if (statusFilter === "paid") {
      result = paidTransactions
    } else if (statusFilter === "all") {
      result = [...transactions, ...paidTransactions]
    } else {
      result = transactions
    }

    // Aplicar filtro de búsqueda solo si hay un término
    if (searchTerm.trim() !== "") {
      const searchTermLower = searchTerm.toLowerCase()
      result = result.filter(
        (transaction) =>
          (transaction.user?.firstName?.toLowerCase() || "").includes(searchTermLower) ||
          (transaction.user?.lastName?.toLowerCase() || "").includes(searchTermLower) ||
          (transaction.event?.name?.toLowerCase() || "").includes(searchTermLower),
      )
    }

    // Actualizar el total de páginas basado en los resultados filtrados
    const totalFilteredItems = result.length
    const newTotalPages = Math.max(1, Math.ceil(totalFilteredItems / ITEMS_PER_PAGE))

    // Solo actualizar si es diferente para evitar re-renders
    if (newTotalPages !== totalPages) {
      setTotalPages(newTotalPages)
    }

    // Aplicar paginación en memoria
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE

    return result.slice(startIndex, endIndex)
  }, [transactions, paidTransactions, statusFilter, searchTerm, currentPage, ITEMS_PER_PAGE, totalPages])

  // Handle view details
  const handleViewDetails = (transaction: TicketTransaction) => {
    setSelectedTransaction(transaction)
    setIsDetailsModalOpen(true)
  }

  // Handle approve transaction
  const handleApprove = (transaction: TicketTransaction) => {
    setSelectedTransaction(transaction)
    setIsApproveModalOpen(true)
  }

  // Handle reject transaction
  const handleReject = async (transaction: TicketTransaction) => {
    if (!user) return

    try {
      setIsRejecting(true)

      // Mostrar un prompt para obtener el motivo del rechazo
      const reason = window.prompt(
        "Por favor, ingresa el motivo del rechazo (será visible para el usuario):",
        "Comprobante de pago rechazado. Por favor, intenta de nuevo con un comprobante válido.",
      )

      // Si el usuario cancela el prompt, no continuar
      if (reason === null) {
        setIsRejecting(false)
        return
      }

      await rejectTicketTransaction(transaction.id, user.id, reason)

      toast({
        title: "Transacción rechazada",
        description: "La transacción ha sido rechazada exitosamente.",
      })

      // Forzar recarga de datos
      refreshData()
    } catch (error) {
      console.error("Error rejecting transaction:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al rechazar la transacción.",
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">Aprobado</Badge>
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshData} className="whitespace-nowrap">
              <Loader2 className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button variant="default" onClick={() => setIsAssignModalOpen(true)} className="whitespace-nowrap">
              Asignar Tickets
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="paid">Pagados completamente</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center p-4 mb-4 bg-blue-50 rounded-md">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-500" />
            <p className="text-blue-700">Optimizando carga de datos...</p>
          </div>
        )}

        {lastCacheUpdate && !loading && (
          <div className="text-xs text-muted-foreground mb-4 text-right">
            Última actualización: {new Date(lastCacheUpdate).toLocaleTimeString()}
          </div>
        )}

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
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
                      <span>Cargando tickets...</span>
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
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    data-transaction-id={transaction.id}
                    className={statusFilter === "paid" ? "bg-green-50" : ""}
                  >
                    <TableCell className="font-medium">{transaction.event?.name || "Evento"}</TableCell>
                    <TableCell>
                      {transaction.user?.firstName} {transaction.user?.lastName}
                    </TableCell>
                    <TableCell>
                      {transaction.createdAt ? formatDate(transaction.createdAt) : "Fecha no disponible"}
                    </TableCell>
                    <TableCell>{transaction.paymentType === "full" ? "Pago completo" : "Cuotas"}</TableCell>
                    <TableCell>${transaction.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {transaction.paymentStatus === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleApprove(transaction)}
                              title="Aprobar transacción"
                              data-action="approve"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="sr-only">Aprobar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleReject(transaction)}
                              disabled={isRejecting}
                              title="Rechazar transacción"
                            >
                              {isRejecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="sr-only">Rechazar</span>
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewDetails(transaction)}
                          title="Ver detalles"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Ver detalles</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No se encontraron tickets
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!loading && !error && filteredTransactions.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Mostrar páginas alrededor de la actual
                    let pageToShow
                    if (totalPages <= 5) {
                      pageToShow = i + 1
                    } else if (currentPage <= 3) {
                      pageToShow = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i
                    } else {
                      pageToShow = currentPage - 2 + i
                    }

                    return (
                      <PaginationItem key={pageToShow}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageToShow)}
                          isActive={currentPage === pageToShow}
                        >
                          {pageToShow}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </CardContent>

      {/* Ticket Details Modal */}
      {selectedTransaction && (
        <TicketDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          transaction={selectedTransaction}
        />
      )}

      {/* Approve Ticket Modal */}
      {selectedTransaction && (
        <ApproveTicketModal
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
          transaction={selectedTransaction}
          onSuccess={async () => {
            // Forzar recarga de datos
            refreshData()

            toast({
              title: "Transacción aprobada",
              description: "La transacción ha sido aprobada exitosamente.",
            })
          }}
        />
      )}

      {/* Assign Ticket Modal */}
      <AssignTicketModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={async () => {
          // Forzar recarga de datos
          refreshData()

          toast({
            title: "Tickets asignados",
            description: "Los tickets han sido asignados exitosamente al usuario.",
          })
        }}
      />
    </Card>
  )
}
