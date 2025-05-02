"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, CheckCircle, XCircle, FileText, Loader2, AlertTriangle } from "lucide-react"
import {
  getPendingInstallmentPayments,
  approveInstallmentPayment,
  rejectInstallmentPayment,
} from "@/lib/firebase/tickets"
import type { PaymentInstallment } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { InstallmentDetailsModal } from "@/components/admin/installment-details-modal"
import { formatDate } from "@/lib/utils"

export function PendingInstallmentsList() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")

  const [installments, setInstallments] = useState<PaymentInstallment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Fetch pending installment payments
  useEffect(() => {
    const fetchInstallments = async () => {
      try {
        setLoading(true)
        setError(null)

        const pendingInstallments = await getPendingInstallmentPayments()
        setInstallments(pendingInstallments)
      } catch (err) {
        console.error("Error fetching installments:", err)
        setError("Ocurrió un error al cargar los pagos pendientes")
      } finally {
        setLoading(false)
      }
    }

    fetchInstallments()
  }, [])

  // Filter installments based on search term
  const filteredInstallments = installments.filter((installment) => {
    const matchesSearch =
      (installment.user?.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (installment.user?.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (installment.transaction?.event?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Handle view details
  const handleViewDetails = (installment: PaymentInstallment) => {
    setSelectedInstallment(installment)
    setIsDetailsModalOpen(true)
  }

  // Handle approve installment
  const handleApprove = async (installment: PaymentInstallment) => {
    if (!user) return

    try {
      setProcessingId(installment.id)
      await approveInstallmentPayment(installment.id, user.id)

      toast({
        title: "Pago aprobado",
        description: "El pago ha sido aprobado exitosamente.",
      })

      // Refresh installments
      const updatedInstallments = await getPendingInstallmentPayments()
      setInstallments(updatedInstallments)
    } catch (error) {
      console.error("Error approving installment:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al aprobar el pago.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  // Handle reject installment
  const handleReject = async (installment: PaymentInstallment) => {
    if (!user) return

    try {
      setProcessingId(installment.id)

      // Mostrar un prompt para obtener el motivo del rechazo
      const reason = window.prompt(
        "Por favor, ingresa el motivo del rechazo (será visible para el usuario):",
        "Comprobante de pago rechazado. Por favor, intenta de nuevo con un comprobante válido.",
      )

      // Si el usuario cancela el prompt, no continuar
      if (reason === null) {
        setProcessingId(null)
        return
      }

      await rejectInstallmentPayment(installment.id, user.id, reason)

      toast({
        title: "Pago rechazado",
        description: "El pago ha sido rechazado exitosamente.",
      })

      // Refresh installments
      const updatedInstallments = await getPendingInstallmentPayments()
      setInstallments(updatedInstallments)
    } catch (error) {
      console.error("Error rejecting installment:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al rechazar el pago.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagos de cuotas pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pagos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Cuota</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Cargando pagos pendientes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-red-500">
                    <div className="flex justify-center items-center">
                      <AlertTriangle className="h-6 w-6 mr-2" />
                      <span>{error}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInstallments.length > 0 ? (
                filteredInstallments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell className="font-medium">{installment.transaction?.event?.name || "Evento"}</TableCell>
                    <TableCell>
                      {installment.user?.firstName} {installment.user?.lastName}
                    </TableCell>
                    <TableCell>
                      {installment.installmentNumber} de {installment.transaction?.numberOfInstallments}
                    </TableCell>
                    <TableCell>
                      {installment.dueDate ? formatDate(installment.dueDate) : "Fecha no disponible"}
                    </TableCell>
                    <TableCell>
                      ${installment.amount.toFixed(2)} {installment.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleApprove(installment)}
                          disabled={processingId === installment.id}
                          title="Aprobar pago"
                        >
                          {processingId === installment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="sr-only">Aprobar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleReject(installment)}
                          disabled={processingId === installment.id}
                          title="Rechazar pago"
                        >
                          {processingId === installment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="sr-only">Rechazar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewDetails(installment)}
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
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No hay pagos pendientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Installment Details Modal */}
      {selectedInstallment && (
        <InstallmentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          installment={selectedInstallment}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </Card>
  )
}
