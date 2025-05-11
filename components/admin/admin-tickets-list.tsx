"use client"

import { useState, useEffect } from "react"
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
  getPendingTicketTransactionsCount,
  getPaidTicketTransactionsCount,
  getPendingTicketTransactionsPaginated,
  getPaidTicketTransactionsPaginated,
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

  // Fetch pending transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener el total de transacciones para calcular las páginas
        let pendingTxCount = 0
        let paidTxCount = 0

        try {
          pendingTxCount = await getPendingTicketTransactionsCount()
          paidTxCount = await getPaidTicketTransactionsCount()
        } catch (countError) {
          console.error("Error obteniendo conteo de transacciones:", countError)
          // Continuar con valores predeterminados si hay error en el conteo
        }

        const totalItems = pendingTxCount + paidTxCount
        const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
        setTotalPages(calculatedTotalPages)

        // Cargar datos de la primera página
        loadPageData()
      } catch (err) {
        console.error("Error general al cargar transacciones:", err)
        setError("Ocurrió un error al cargar las transacciones. Por favor, intente nuevamente.")
        setLoading(false)
      }
    }

    const loadPageData = async () => {
      if (currentPage < 1) return

      setLoading(true)
      try {
        if (statusFilter === "paid" || statusFilter === "all") {
          try {
            const paidTx = await getPaidTicketTransactionsPaginated(currentPage, ITEMS_PER_PAGE)
            setPaidTransactions(paidTx)
          } catch (error) {
            console.error("Error cargando transacciones pagadas:", error)
            toast({
              title: "Error",
              description: "No se pudieron cargar los tickets pagados",
              variant: "destructive",
            })
          }
        }

        if (
          statusFilter === "pending" ||
          statusFilter === "approved" ||
          statusFilter === "rejected" ||
          statusFilter === "all"
        ) {
          try {
            const pendingTx = await getPendingTicketTransactionsPaginated(currentPage, ITEMS_PER_PAGE)
            setTransactions(pendingTx)
          } catch (error) {
            console.error("Error cargando transacciones pendientes:", error)
            toast({
              title: "Error",
              description: "No se pudieron cargar los tickets pendientes",
              variant: "destructive",
            })
          }
        }
      } catch (err) {
        console.error("Error general al cambiar de página:", err)
        toast({
          title: "Error",
          description: "No se pudieron cargar más tickets",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Recargar cuando cambie la página
  useEffect(() => {
    const loadPageData = async () => {
      if (currentPage < 1) return

      setLoading(true)
      try {
        if (statusFilter === "paid" || statusFilter === "all") {
          try {
            const paidTx = await getPaidTicketTransactionsPaginated(currentPage, ITEMS_PER_PAGE)
            setPaidTransactions(paidTx)
          } catch (error) {
            console.error("Error cargando transacciones pagadas:", error)
            toast({
              title: "Error",
              description: "No se pudieron cargar los tickets pagados",
              variant: "destructive",
            })
          }
        }

        if (
          statusFilter === "pending" ||
          statusFilter === "approved" ||
          statusFilter === "rejected" ||
          statusFilter === "all"
        ) {
          try {
            const pendingTx = await getPendingTicketTransactionsPaginated(currentPage, ITEMS_PER_PAGE)
            setTransactions(pendingTx)
          } catch (error) {
            console.error("Error cargando transacciones pendientes:", error)
            toast({
              title: "Error",
              description: "No se pudieron cargar los tickets pendientes",
              variant: "destructive",
            })
          }
        }
      } catch (err) {
        console.error("Error general al cambiar de página:", err)
        toast({
          title: "Error",
          description: "No se pudieron cargar más tickets",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadPageData()
  }, [currentPage, statusFilter])

  // Filter transactions based on search term and status
  const filteredTransactions = (() => {
    // Si el filtro es "all", mostrar todas las transacciones (pendientes y pagadas)
    if (statusFilter === "all") {
      // Combinar los arrays de transacciones regulares y pagadas
      const allTransactions = [...transactions, ...paidTransactions]

      // Filtrar solo por término de búsqueda, no por estado
      return allTransactions.filter(
        (transaction) =>
          (transaction.user?.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (transaction.user?.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (transaction.event?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
      )
    }

    // Si el filtro es "paid", mostrar las transacciones pagadas completamente
    if (statusFilter === "paid") {
      return paidTransactions.filter((transaction) => {
        return (
          (transaction.user?.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (transaction.user?.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (transaction.event?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        )
      })
    }

    // Para otros filtros, usar las transacciones pendientes/normales
    return transactions.filter((transaction) => {
      const matchesSearch =
        (transaction.user?.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (transaction.user?.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (transaction.event?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())

      const matchesStatus = transaction.paymentStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  })()

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

      // Refresh transactions
      const updatedTransactions = await getPendingTicketTransactions()
      setTransactions(updatedTransactions)
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
            // Refresh transactions
            const [updatedTransactions, updatedPaidTransactions] = await Promise.all([
              getPendingTicketTransactions(),
              getPaidTicketTransactions(),
            ])

            setTransactions(updatedTransactions)
            setPaidTransactions(updatedPaidTransactions)

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
          // Refresh transactions after assigning tickets
          const [updatedTransactions, updatedPaidTransactions] = await Promise.all([
            getPendingTicketTransactions(),
            getPaidTicketTransactions(),
          ])

          setTransactions(updatedTransactions)
          setPaidTransactions(updatedPaidTransactions)

          toast({
            title: "Tickets asignados",
            description: "Los tickets han sido asignados exitosamente al usuario.",
          })
        }}
      />
    </Card>
  )
}
