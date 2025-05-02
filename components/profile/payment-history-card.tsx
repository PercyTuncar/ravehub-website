"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { TicketTransaction } from "@/types"
import { ChevronDown, ChevronUp, FileText } from "lucide-react"

interface PaymentHistoryCardProps {
  transaction: TicketTransaction
  currency: string
  exchangeRates: Record<string, number>
}

export function PaymentHistoryCard({ transaction, currency, exchangeRates }: PaymentHistoryCardProps) {
  const [isOpen, setIsOpen] = useState(false)

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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{transaction.event?.name || "Evento"}</CardTitle>
            <CardDescription>
              Compra realizada el {transaction.createdAt ? formatDate(transaction.createdAt) : "Fecha no disponible"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getPaymentStatusBadge(transaction.paymentStatus)}
            {transaction.isCourtesy && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                Cortesía
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Total pagado</p>
              <p className="text-2xl font-bold">
                {formatCurrency(transaction.totalAmount, transaction.currency, currency, exchangeRates)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">Método de pago</p>
              <p>
                {transaction.offlinePaymentMethod === "yape"
                  ? "Yape"
                  : transaction.offlinePaymentMethod === "plin"
                    ? "Plin"
                    : "Transferencia bancaria"}
              </p>
            </div>
          </div>

          {transaction.paymentProofUrl && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => window.open(transaction.paymentProofUrl, "_blank")}>
                <FileText className="mr-2 h-4 w-4" />
                Ver comprobante
              </Button>
            </div>
          )}

          {transaction.paymentType === "installment" &&
            transaction.installments &&
            transaction.installments.length > 0 && (
              <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Detalle de cuotas</p>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="mt-2">
                  <div className="space-y-2 border rounded-md p-3">
                    {transaction.installments.map((installment) => (
                      <div
                        key={installment.id}
                        className="flex justify-between items-center py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            Cuota {installment.installmentNumber} de {transaction.numberOfInstallments}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {installment.paymentDate
                              ? `Pagado el ${formatDate(installment.paymentDate)}`
                              : installment.dueDate
                                ? `Vencimiento: ${formatDate(installment.dueDate)}`
                                : "Fecha no disponible"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(installment.amount, installment.currency, currency, exchangeRates)}
                          </p>
                          <div>{getInstallmentStatusBadge(installment.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
