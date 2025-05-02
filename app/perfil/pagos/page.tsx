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
import { AlertCircle, Clock, FileText } from "lucide-react"
import { PayInstallmentModal } from "@/components/tickets/pay-installment-modal"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import AuthRouteGuard from "@/components/auth/auth-route-guard"
import { PaymentHistoryCard } from "@/components/profile/payment-history-card"

export default function UserPaymentsPage() {
  const { user } = useAuth()
  const { currency, exchangeRates } = useCurrency()

  const [transactions, setTransactions] = useState<TicketTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null)
  const [isPayInstallmentModalOpen, setIsPayInstallmentModalOpen] = useState(false)

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

          // Get event data
          let eventData = null
          if (transactionData.eventId) {
            const eventDoc = await getDoc(doc(db, "events", transactionData.eventId))
            if (eventDoc.exists()) {
              eventData = eventDoc.data()
            }
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

          // Get installments if applicable
          let installments: PaymentInstallment[] = []
          if (transactionData.paymentType === "installment") {
            const installmentsQuery = query(
              collection(db, "paymentInstallments"),
              where("transactionId", "==", transactionId),
            )
            const installmentsSnapshot = await getDocs(installmentsQuery)

            installments = installmentsSnapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                ...data,
                id: doc.id,
                dueDate:
                  data.dueDate && typeof data.dueDate.toDate === "function"
                    ? data.dueDate.toDate()
                    : new Date(data.dueDate),
                paymentDate:
                  data.paymentDate && typeof data.paymentDate.toDate === "function"
                    ? data.paymentDate.toDate()
                    : data.paymentDate
                      ? new Date(data.paymentDate)
                      : undefined,
                approvedAt:
                  data.approvedAt && typeof data.approvedAt.toDate === "function"
                    ? data.approvedAt.toDate()
                    : data.approvedAt
                      ? new Date(data.approvedAt)
                      : undefined,
              } as PaymentInstallment
            })
          }

          // Add to transactions array
          transactionsData.push({
            ...transactionData,
            id: transactionId,
            createdAt,
            ticketsDownloadAvailableDate,
            event: eventData,
            installments,
          })
        }

        setTransactions(transactionsData)
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError("Ocurrió un error al cargar tus pagos. Por favor, intenta de nuevo.")
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user])

  // Handle pay installment
  const handlePayInstallment = (installment: PaymentInstallment) => {
    setSelectedInstallment(installment)
    setIsPayInstallmentModalOpen(true)
  }

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
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

  // Get installment status badge
  const getInstallmentStatusBadge = (status: string) => {
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

  // Group transactions by payment status
  const pendingPayments = transactions.filter(
    (t) =>
      t.paymentStatus === "pending" ||
      (t.paymentType === "installment" && t.installments?.some((i) => i.status === "pending")),
  )

  const completedPayments = transactions.filter(
    (t) =>
      t.paymentStatus === "approved" &&
      (t.paymentType !== "installment" || !t.installments?.some((i) => i.status === "pending")),
  )

  // Get all installments across all transactions
  const allInstallments = transactions
    .filter((t) => t.paymentType === "installment" && t.installments)
    .flatMap((t) => t.installments || [])
    .map((installment) => ({
      ...installment,
      transaction: transactions.find((t) => t.id === installment.transactionId),
    }))

  // Sort installments by due date (most recent first)
  const sortedInstallments = [...allInstallments].sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  })

  // Pending installments
  const pendingInstallments = sortedInstallments.filter((i) => i.status === "pending")

  // Upcoming installments (due in the next 30 days)
  const now = new Date()
  const thirtyDaysFromNow = new Date(now)
  thirtyDaysFromNow.setDate(now.getDate() + 30)

  const upcomingInstallments = sortedInstallments.filter((i) => {
    if (i.status !== "pending") return false
    if (!i.dueDate) return false
    const dueDate = new Date(i.dueDate)
    return dueDate > now && dueDate <= thirtyDaysFromNow
  })

  return (
    <AuthRouteGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mis pagos</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando tus pagos...</p>
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
            <AlertTitle>No tienes pagos</AlertTitle>
            <AlertDescription>
              Aún no has realizado pagos. Explora nuestros eventos y compra tus entradas.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending">Pendientes ({pendingPayments.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Próximos ({upcomingInstallments.length})</TabsTrigger>
              <TabsTrigger value="history">Historial ({completedPayments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-6">
              {pendingPayments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No tienes pagos pendientes.</AlertDescription>
                </Alert>
              ) : (
                <>
                  {pendingInstallments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Cuotas pendientes</CardTitle>
                        <CardDescription>Cuotas que requieren tu atención</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {pendingInstallments.map((installment) => {
                          const transaction = installment.transaction
                          if (!transaction) return null

                          return (
                            <div
                              key={installment.id}
                              className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                            >
                              <div>
                                <h3 className="font-medium">
                                  {transaction.event?.name || "Evento"} - Cuota {installment.installmentNumber} de{" "}
                                  {transaction.numberOfInstallments}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Vencimiento:{" "}
                                  {installment.dueDate ? formatDate(installment.dueDate) : "Fecha no disponible"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="font-medium">
                                    {formatCurrency(installment.amount, installment.currency, currency, exchangeRates)}
                                  </p>
                                  {getInstallmentStatusBadge(installment.status)}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-auto">
                                {!installment.paymentProofUrl ? (
                                  <Button
                                    onClick={() => handlePayInstallment(installment)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Pagar ahora
                                  </Button>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <Badge
                                      variant="outline"
                                      className="bg-yellow-50 text-yellow-700 border-yellow-200 mb-1"
                                    >
                                      En revisión
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">Comprobante enviado</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {pendingPayments
                    .filter((t) => t.paymentStatus === "pending")
                    .map((transaction) => (
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
                            {getPaymentStatusBadge(transaction.paymentStatus)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold">Detalles del pago</h3>
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
                                Tu pago está siendo revisado por nuestro equipo. Te notificaremos cuando sea aprobado.
                              </AlertDescription>
                            </Alert>

                            {transaction.paymentProofUrl && (
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(transaction.paymentProofUrl, "_blank")}
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Ver comprobante
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-6">
              {upcomingInstallments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No tienes pagos próximos a vencer.</AlertDescription>
                </Alert>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Pagos próximos a vencer</CardTitle>
                    <CardDescription>Cuotas que vencen en los próximos 30 días</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingInstallments.map((installment) => {
                      const transaction = installment.transaction
                      if (!transaction) return null

                      // Calculate days until due
                      const dueDate = new Date(installment.dueDate)
                      const today = new Date()
                      const diffTime = dueDate.getTime() - today.getTime()
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                      return (
                        <div
                          key={installment.id}
                          className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                          <div>
                            <h3 className="font-medium">
                              {transaction.event?.name || "Evento"} - Cuota {installment.installmentNumber} de{" "}
                              {transaction.numberOfInstallments}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-muted-foreground">
                                Vence en {diffDays} días (
                                {installment.dueDate ? formatDate(installment.dueDate) : "Fecha no disponible"})
                              </p>
                              <Badge variant={diffDays <= 7 ? "destructive" : "outline"} className="text-xs">
                                {diffDays <= 3 ? "¡Urgente!" : diffDays <= 7 ? "Próximo" : "Pendiente"}
                              </Badge>
                            </div>
                            <p className="font-medium mt-1">
                              {formatCurrency(installment.amount, installment.currency, currency, exchangeRates)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto">
                            {!installment.paymentProofUrl ? (
                              <Button
                                onClick={() => handlePayInstallment(installment)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Pagar ahora
                              </Button>
                            ) : (
                              <div className="flex flex-col items-end">
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-50 text-yellow-700 border-yellow-200 mb-1"
                                >
                                  En revisión
                                </Badge>
                                <p className="text-xs text-muted-foreground">Comprobante enviado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {completedPayments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No tienes pagos completados en tu historial.</AlertDescription>
                </Alert>
              ) : (
                <>
                  {completedPayments.map((transaction) => (
                    <PaymentHistoryCard
                      key={transaction.id}
                      transaction={transaction}
                      currency={currency}
                      exchangeRates={exchangeRates}
                    />
                  ))}
                </>
              )}
            </TabsContent>
          </Tabs>
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
                // Similar refresh logic as in the entradas page
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
                      const transactionId = transactionDoc.id

                      // Get event data
                      let eventData = null
                      if (transactionData.eventId) {
                        const eventDoc = await getDoc(doc(db, "events", transactionData.eventId))
                        if (eventDoc.exists()) {
                          eventData = eventDoc.data()
                        }
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

                      // Get installments if applicable
                      let installments: PaymentInstallment[] = []
                      if (transactionData.paymentType === "installment") {
                        const installmentsQuery = query(
                          collection(db, "paymentInstallments"),
                          where("transactionId", "==", transactionId),
                        )
                        const installmentsSnapshot = await getDocs(installmentsQuery)

                        installments = installmentsSnapshot.docs.map((doc) => {
                          const data = doc.data()
                          return {
                            ...data,
                            id: doc.id,
                            dueDate:
                              data.dueDate && typeof data.dueDate.toDate === "function"
                                ? data.dueDate.toDate()
                                : new Date(data.dueDate),
                            paymentDate:
                              data.paymentDate && typeof data.paymentDate.toDate === "function"
                                ? data.paymentDate.toDate()
                                : data.paymentDate
                                  ? new Date(data.paymentDate)
                                  : undefined,
                            approvedAt:
                              data.approvedAt && typeof data.approvedAt.toDate === "function"
                                ? data.approvedAt.toDate()
                                : data.approvedAt
                                  ? new Date(data.approvedAt)
                                  : undefined,
                          } as PaymentInstallment
                        })
                      }

                      // Add to transactions array
                      transactionsData.push({
                        ...transactionData,
                        id: transactionId,
                        createdAt,
                        ticketsDownloadAvailableDate,
                        event: eventData,
                        installments,
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
