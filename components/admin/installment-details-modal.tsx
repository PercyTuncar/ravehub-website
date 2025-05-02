"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import type { PaymentInstallment } from "@/types"
import { formatDate } from "@/lib/utils"
import Image from "next/image"

interface InstallmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  installment: PaymentInstallment
  onApprove?: (installment: PaymentInstallment) => void
  onReject?: (installment: PaymentInstallment) => void
}

export function InstallmentDetailsModal({
  isOpen,
  onClose,
  installment,
  onApprove,
  onReject,
}: InstallmentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [imageError, setImageError] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async () => {
    if (!onApprove) return

    setIsProcessing(true)
    try {
      await onApprove(installment)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!onReject) return

    setIsProcessing(true)
    try {
      await onReject(installment)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Detalles del pago</DialogTitle>
          <DialogDescription>
            Cuota {installment.installmentNumber} de {installment.transaction?.numberOfInstallments}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="user">Usuario</TabsTrigger>
            <TabsTrigger value="payment">Comprobante</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Evento</h3>
                <p className="text-base">{installment.transaction?.event?.name || "Evento"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Monto</h3>
                <p className="text-base">
                  ${installment.amount.toFixed(2)} {installment.currency}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Fecha de vencimiento</h3>
                <p className="text-base">
                  {installment.dueDate ? formatDate(installment.dueDate) : "Fecha no disponible"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Número de cuota</h3>
                <p className="text-base">
                  {installment.installmentNumber} de {installment.transaction?.numberOfInstallments}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">ID de transacción</h3>
                <p className="text-base">{installment.transactionId}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="user" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
                <p className="text-base">
                  {installment.user?.firstName} {installment.user?.lastName}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p className="text-base">{installment.user?.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Teléfono</h3>
                <p className="text-base">
                  {installment.user?.phonePrefix} {installment.user?.phone}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">País</h3>
                <p className="text-base">{installment.user?.country}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Documento</h3>
                <p className="text-base">
                  {installment.user?.documentType} {installment.user?.documentNumber}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            {installment.paymentProofUrl ? (
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium mb-2">Comprobante de pago</h3>
                {imageError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error al cargar la imagen</AlertTitle>
                    <AlertDescription>
                      No se pudo cargar la imagen del comprobante. El enlace puede ser inválido o la imagen puede haber
                      sido eliminada.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="relative w-full h-[400px] border rounded-md overflow-hidden">
                    <Image
                      src={installment.paymentProofUrl || "/placeholder.svg"}
                      alt="Comprobante de pago"
                      fill
                      className="object-contain"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => window.open(installment.paymentProofUrl, "_blank")}>
                    Ver en tamaño completo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay comprobante de pago disponible</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {onApprove && onReject && (
            <div className="flex gap-2 mr-auto">
              <Button
                variant="default"
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Aprobar pago
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Rechazar pago
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
