"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useCurrency } from "@/context/currency-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { TicketTransaction, PaymentInstallment } from "@/types"
import { AlertCircle, Clock, XCircle } from "lucide-react"
import { NominateTicketModal } from "@/components/tickets/nominate-ticket-modal"
import { PayInstallmentModal } from "@/components/tickets/pay-installment-modal"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { ApprovedTicketCard } from "@/components/tickets/approved-ticket-card"
import { PendingDownloadTicket } from "@/components/tickets/pending-download-ticket"
import AuthRouteGuard from "@/components/auth/auth-route-guard"

export default function UserTicketsPage() {
  const { user } = useAuth()
  const { currency, exchangeRates } = useCurrency()

  const [transactions, setTransactions] = useState<TicketTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false)

  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null)
  const [isPayInstallmentModalOpen, setIsPayInstallmentModalOpen] = useState(false)

  // Remove the redirection logic since AuthRouteGuard will handle it
  // useEffect(() => {
  //   if (!user && !loading) {
  //     router.push("/login?redirect=/perfil/entradas")
  //   }
  // }, [user, loading, router])

  // Fetch user's ticket transactions directly from Firestore
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Query transactions directly from Firestore
        const transactionsQuery = query(collection(db, "ticketTransactions"), where("userId", "==", user.id))

        const transactionsSnapshot = await getDocs(transactionsQuery)
        const transactionsData: TicketTransaction[] = []

        for (const transactionDoc of transactionsSnapshot.docs) {
          const transactionData = transactionDoc.data() as TicketTransaction
          const transactionId = transactionDoc.id

          console.log(`Procesando transacción: ${transactionId}`, transactionData)

          // Get event data
          let eventData = null
          if (transactionData.eventId) {
            const eventDoc = await getDoc(doc(db, "events", transactionData.eventId))
            if (eventDoc.exists()) {
              eventData = eventDoc.data()
              console.log(`Evento encontrado: ${eventData.name}`)
            } else {
              console.log(`No se encontró el evento con ID: ${transactionData.eventId}`)
            }
          }

          // Asegurarse de que ticketItems sea un array
          let ticketItems = []
          if (transactionData.ticketItems && Array.isArray(transactionData.ticketItems)) {
            console.log(
              `La transacción ${transactionId} tiene ${transactionData.ticketItems.length} tickets en su array`,
            )
            ticketItems = transactionData.ticketItems.map((item) => ({
              ...item,
              createdAt: typeof item.createdAt === "string" ? new Date(item.createdAt) : item.createdAt,
              updatedAt: typeof item.updatedAt === "string" ? new Date(item.updatedAt) : item.updatedAt,
            }))
          } else {
            console.log(`La transacción ${transactionId} no tiene un array de ticketItems válido`)
          }

          // Format dates
          const createdAt = transactionData.createdAt
            ? typeof transactionData.createdAt === "object" && transactionData.createdAt.toDate
              ? transactionData.createdAt.toDate()
              : new Date(transactionData.createdAt)
            : null

          const ticketsDownloadAvailableDate = transactionData.ticketsDownloadAvailableDate
            ? typeof transactionData.ticketsDownloadAvailableDate === "object" &&
              transactionData.ticketsDownloadAvailableDate.toDate
              ? transactionData.ticketsDownloadAvailableDate.toDate()
              : new Date(transactionData.ticketsDownloadAvailableDate)
            : null

          // Add to transactions array
          transactionsData.push({
            ...transactionData,
            id: transactionId,
            createdAt,
            ticketsDownloadAvailableDate,
            ticketItems,
            event: eventData,
          })
        }

        console.log("Transacciones procesadas:", transactionsData)
        setTransactions(transactionsData)
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError("Ocurrió un error al cargar tus entradas. Por favor, intenta de nuevo.")
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user])

  // Handle nominate ticket
  const handleNominateTicket = (ticketId: string, transactionId: string) => {
    setSelectedTicketId(ticketId)
    setSelectedTransactionId(transactionId)
    setIsNominateModalOpen(true)
  }

  // Handle pay installment
  const handlePayInstallment = (installment: PaymentInstallment) => {
    setSelectedInstallment(installment)
    setIsPayInstallmentModalOpen(true)
  }

  // Handle download ticket
  const handleDownloadTicket = (ticketPdfUrl: string) => {
    window.open(ticketPdfUrl, "_blank")
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">Aprobado</Badge>
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      case "used":
        return <Badge variant="secondary">Usado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Pagado</Badge>
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>
      case "overdue":
        return <Badge variant="destructive">Vencido</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Check if ticket is downloadable
  const isTicketDownloadable = (transaction: TicketTransaction, ticketItem: any) => {
    // 1. Verificar si el ticket tiene URL de PDF
    if (!ticketItem.ticketPdfUrl) {
      return false
    }

    // 2. Verificar si la transacción está aprobada
    if (transaction.paymentStatus !== "approved") {
      return false
    }

    // 3. Verificar si el ticket está aprobado
    if (ticketItem.status !== "approved") {
      return false
    }

    // 4. Para cortesías, permitir descarga inmediata
    if (transaction.isCourtesy) {
      return true
    }

    // 5. Verificar si la fecha de descarga ha llegado
    if (transaction.ticketsDownloadAvailableDate) {
      const downloadDate = new Date(transaction.ticketsDownloadAvailableDate)
      const now = new Date()

      // Comparar fechas normalizadas (sin hora)
      const downloadDateOnly = new Date(downloadDate.getFullYear(), downloadDate.getMonth(), downloadDate.getDate())
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      return nowDateOnly >= downloadDateOnly
    }

    return true
  }

  // Group transactions by status
  const pendingTransactions = transactions.filter((t) => t.paymentStatus === "pending")
  const approvedTransactions = transactions.filter((t) => t.paymentStatus === "approved")
  const rejectedTransactions = transactions.filter(
    (t) => t.paymentStatus === "rejected" || t.paymentStatus === "cancelled",
  )

  return (
    <AuthRouteGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mis entradas</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando tus entradas...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : transactions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No tienes entradas</AlertTitle>
            <AlertDescription>
              Aún no has comprado entradas. Explora nuestros eventos y compra tus entradas.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="approved">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="approved">Aprobadas ({approvedTransactions.length})</TabsTrigger>
              <TabsTrigger value="pending">Pendientes ({pendingTransactions.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rechazadas ({rejectedTransactions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="approved" className="space-y-6">
              {approvedTransactions.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No tienes entradas aprobadas.</AlertDescription>
                </Alert>
              ) : (
                approvedTransactions.map((transaction) => (
                  <Card key={transaction.id} className="overflow-hidden border-2 border-green-100 shadow-sm">
                    <CardHeader className="bg-green-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{transaction.event?.name || "Evento sin nombre"}</CardTitle>
                          <CardDescription>
                            Compra realizada el{" "}
                            {transaction.createdAt ? formatDate(transaction.createdAt) : "Fecha no disponible"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(transaction.paymentStatus)}
                          {transaction.isCourtesy && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                              Cortesía
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid gap-4">
                        {/* Debug info */}
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <p>Transaction ID: {transaction.id}</p>
                          <p>Tickets Count: {transaction.ticketItems?.length || 0}</p>
                          <p>Is Courtesy: {transaction.isCourtesy ? "Sí" : "No"}</p>
                          <p>
                            Download Date:{" "}
                            {transaction.ticketsDownloadAvailableDate
                              ? formatDate(transaction.ticketsDownloadAvailableDate)
                              : "No definida"}
                          </p>
                        </div>

                        {/* Ticket Items */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Entradas ({transaction.ticketItems?.length || 0})</h3>

                          {!transaction.ticketItems || transaction.ticketItems.length === 0 ? (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>No hay entradas disponibles para esta transacción.</AlertDescription>
                            </Alert>
                          ) : (
                            transaction.ticketItems.map((ticket, index) => {
                              const canDownload = isTicketDownloadable(transaction, ticket)

                              return canDownload ? (
                                <ApprovedTicketCard
                                  key={ticket.id || index}
                                  transaction={transaction}
                                  ticket={ticket}
                                  onDownload={handleDownloadTicket}
                                  canDownload={canDownload}
                                />
                              ) : (
                                <PendingDownloadTicket
                                  key={ticket.id || index}
                                  transaction={transaction}
                                  ticket={ticket}
                                />
                              )
                            })
                          )}
                        </div>

                        {/* Installments if applicable */}
                        {transaction.paymentType === "installment" && transaction.installments && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Cuotas</h3>
                            <div className="border rounded-lg divide-y">
                              {transaction.installments.map((installment) => (
                                <div key={installment.id} className="p-4 flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">
                                      Cuota {installment.installmentNumber} de {transaction.numberOfInstallments}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Vencimiento:{" "}
                                      {installment.dueDate ? formatDate(installment.dueDate) : "Fecha no disponible"}
                                    </p>
                                    <p className="text-sm">
                                      Monto:{" "}
                                      {formatCurrency(
                                        installment.amount,
                                        transaction.currency,
                                        currency,
                                        exchangeRates,
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getPaymentStatusBadge(installment.status)}

                                    {installment.status === "pending" && (
                                      <>
                                        {!installment.paymentProofUrl ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePayInstallment(installment)}
                                          >
                                            Pagar cuota
                                          </Button>
                                        ) : (
                                          <div className="flex flex-col items-end">
                                            <Badge
                                              variant="outline"
                                              className="bg-yellow-50 text-yellow-700 border-yellow-200 mb-1"
                                            >
                                              En revisión
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">
                                              Esperando aprobación del administrador
                                            </p>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-6">
              {pendingTransactions.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No tienes entradas pendientes de aprobación.</AlertDescription>
                </Alert>
              ) : (
                pendingTransactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{transaction.event?.name || "Evento"}</CardTitle>
                          <CardDescription>
                            Compra realizada el{" "}
                            {transaction.createdAt ? formatDate(transaction.createdAt) : "Fecha no disponible"}
                          </CardDescription>
                        </div>
                        {getStatusBadge(transaction.paymentStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Detalles de la compra</h3>
                          <p>
                            <span className="font-medium">Total:</span>{" "}
                            {formatCurrency(transaction.totalAmount, transaction.currency, currency, exchangeRates)}
                          </p>
                          <p>
                            <span className="font-medium">Método de pago:</span>{" "}
                            {transaction.offlinePaymentMethod === "yape"
                              ? "Yape"
                              : transaction.offlinePaymentMethod === "plin"
                                ? "Plin"
                                : "Transferencia bancaria"}
                          </p>
                          <p>
                            <span className="font-medium">Tipo de pago:</span>{" "}
                            {transaction.paymentType === "full" ? "Pago completo" : "Pago en cuotas"}
                          </p>
                        </div>

                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertTitle>Pendiente de aprobación</AlertTitle>
                          <AlertDescription>
                            Tu compra está siendo revisada por nuestro equipo. Te notificaremos cuando sea aprobada.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-6">
              {rejectedTransactions.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No tienes entradas rechazadas.</AlertDescription>
                </Alert>
              ) : (
                rejectedTransactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{transaction.event?.name || "Evento"}</CardTitle>
                          <CardDescription>
                            Compra realizada el{" "}
                            {transaction.createdAt ? formatDate(transaction.createdAt) : "Fecha no disponible"}
                          </CardDescription>
                        </div>
                        {getStatusBadge(transaction.paymentStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Compra rechazada</AlertTitle>
                        <AlertDescription>
                          {transaction.adminNotes ||
                            "Tu compra ha sido rechazada. Por favor, contacta a soporte para más información."}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Nominate Ticket Modal */}
        {selectedTicketId && (
          <NominateTicketModal
            isOpen={isNominateModalOpen}
            onClose={() => setIsNominateModalOpen(false)}
            ticketId={selectedTicketId}
            transactionId={selectedTransactionId || undefined}
            onSuccess={() => {
              // Refresh transactions after nomination
              if (user) {
                // Refresh the transactions
                const fetchTransactions = async () => {
                  try {
                    const transactionsQuery = query(
                      collection(db, "ticketTransactions"),
                      where("userId", "==", user.id),
                    )

                    const transactionsSnapshot = await getDocs(transactionsQuery)
                    const transactionsData: TicketTransaction[] = []

                    for (const transactionDoc of transactionsSnapshot.docs) {
                      const transactionData = transactionDoc.data() as TicketTransaction

                      // Get event data
                      let eventData = null
                      if (transactionData.eventId) {
                        const eventDoc = await getDoc(doc(db, "events", transactionData.eventId))
                        if (eventDoc.exists()) {
                          eventData = eventDoc.data()
                        }
                      }

                      // Asegurarse de que ticketItems sea un array
                      let ticketItems = []
                      if (transactionData.ticketItems && Array.isArray(transactionData.ticketItems)) {
                        ticketItems = transactionData.ticketItems.map((item) => ({
                          ...item,
                          createdAt: typeof item.createdAt === "string" ? new Date(item.createdAt) : item.createdAt,
                          updatedAt: typeof item.updatedAt === "string" ? new Date(item.updatedAt) : item.updatedAt,
                        }))
                      }

                      // Format dates
                      const createdAt = transactionData.createdAt
                        ? typeof transactionData.createdAt === "object" && transactionData.createdAt.toDate
                          ? transactionData.createdAt.toDate()
                          : new Date(transactionData.createdAt)
                        : null

                      const ticketsDownloadAvailableDate = transactionData.ticketsDownloadAvailableDate
                        ? typeof transactionData.ticketsDownloadAvailableDate === "object" &&
                          transactionData.ticketsDownloadAvailableDate.toDate
                          ? transactionData.ticketsDownloadAvailableDate.toDate()
                          : new Date(transactionData.ticketsDownloadAvailableDate)
                        : null

                      // Add to transactions array
                      transactionsData.push({
                        ...transactionData,
                        id: transactionDoc.id,
                        createdAt,
                        ticketsDownloadAvailableDate,
                        ticketItems,
                        event: eventData,
                      })
                    }

                    setTransactions(transactionsData)
                  } catch (err) {
                    console.error("Error refreshing transactions:", err)
                  }
                }

                fetchTransactions()
              }
            }}
          />
        )}

        {/* Pay Installment Modal */}
        {selectedInstallment && (
          <PayInstallmentModal
            isOpen={isPayInstallmentModalOpen}
            onClose={() => setIsPayInstallmentModalOpen(false)}
            installment={selectedInstallment}
            onSuccess={() => {
              // Refresh transactions after payment
              if (user) {
                // Similar refresh logic as above
                const fetchTransactions = async () => {
                  try {
                    const transactionsQuery = query(
                      collection(db, "ticketTransactions"),
                      where("userId", "==", user.id),
                    )

                    const transactionsSnapshot = await getDocs(transactionsQuery)
                    const transactionsData: TicketTransaction[] = []

                    for (const transactionDoc of transactionsSnapshot.docs) {
                      const transactionData = transactionDoc.data() as TicketTransaction

                      // Get event data
                      let eventData = null
                      if (transactionData.eventId) {
                        const eventDoc = await getDoc(doc(db, "events", transactionData.eventId))
                        if (eventDoc.exists()) {
                          eventData = eventDoc.data()
                        }
                      }

                      // Asegurarse de que ticketItems sea un array
                      let ticketItems = []
                      if (transactionData.ticketItems && Array.isArray(transactionData.ticketItems)) {
                        ticketItems = transactionData.ticketItems.map((item) => ({
                          ...item,
                          createdAt: typeof item.createdAt === "string" ? new Date(item.createdAt) : item.createdAt,
                          updatedAt: typeof item.updatedAt === "string" ? new Date(item.updatedAt) : item.updatedAt,
                        }))
                      }

                      // Format dates
                      const createdAt = transactionData.createdAt
                        ? typeof transactionData.createdAt === "object" && transactionData.createdAt.toDate
                          ? transactionData.createdAt.toDate()
                          : new Date(transactionData.createdAt)
                        : null

                      const ticketsDownloadAvailableDate = transactionData.ticketsDownloadAvailableDate
                        ? typeof transactionData.ticketsDownloadAvailableDate === "object" &&
                          transactionData.ticketsDownloadAvailableDate.toDate
                          ? transactionData.ticketsDownloadAvailableDate.toDate()
                          : new Date(transactionData.ticketsDownloadAvailableDate)
                        : null

                      // Add to transactions array
                      transactionsData.push({
                        ...transactionData,
                        id: transactionDoc.id,
                        createdAt,
                        ticketsDownloadAvailableDate,
                        ticketItems,
                        event: eventData,
                      })
                    }

                    setTransactions(transactionsData)
                  } catch (err) {
                    console.error("Error refreshing transactions:", err)
                  }
                }

                fetchTransactions()
              }
            }}
          />
        )}
      </div>
    </AuthRouteGuard>
  )
}
