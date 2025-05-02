"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useCurrency } from "@/context/currency-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatCurrency } from "@/lib/utils"
import type { PaymentInstallment } from "@/types"
import { submitInstallmentPayment, uploadPaymentProof } from "@/lib/firebase/tickets"
import { offlinePaymentMethods } from "@/lib/constants"
import { Upload } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"

interface PayInstallmentModalProps {
  isOpen: boolean
  onClose: () => void
  installment: PaymentInstallment
  onSuccess?: () => void
}

export function PayInstallmentModal({ isOpen, onClose, installment, onSuccess }: PayInstallmentModalProps) {
  const { user } = useAuth()
  const { currency, exchangeRates } = useCurrency()

  const [offlineMethod, setOfflineMethod] = useState<"yape" | "plin" | "transfer">("yape")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0])
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar este pago",
        variant: "destructive",
      })
      return
    }

    if (!paymentProof) {
      toast({
        title: "Error",
        description: "Debes adjuntar un comprobante de pago",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Upload payment proof
      const paymentProofUrl = await uploadPaymentProof(
        paymentProof,
        `payment-proofs/${user.id}/${installment.transactionId}/installment-${installment.installmentNumber}-${uuidv4()}`,
      )

      // Submit installment payment
      await submitInstallmentPayment(installment.id, paymentProofUrl)

      toast({
        title: "¡Pago enviado!",
        description: "Tu pago ha sido enviado y está pendiente de aprobación.",
      })

      onClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error submitting payment:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu pago. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagar cuota</DialogTitle>
          <DialogDescription>
            Cuota {installment.installmentNumber} - Vencimiento:{" "}
            {installment.dueDate ? new Date(installment.dueDate).toLocaleDateString() : "Fecha no disponible"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="bg-muted p-3 rounded-md">
            <h4 className="font-medium mb-2">Detalles de la cuota</h4>
            <p className="text-sm">
              <span className="font-medium">Monto:</span>{" "}
              {formatCurrency(installment.amount, installment.currency, currency, exchangeRates)}
            </p>
            <p className="text-sm">
              <span className="font-medium">Fecha de vencimiento:</span>{" "}
              {installment.dueDate ? new Date(installment.dueDate).toLocaleDateString() : "Fecha no disponible"}
            </p>
          </div>

          <div className="space-y-4">
            <Label>Método de pago</Label>
            <RadioGroup
              value={offlineMethod}
              onValueChange={(value) => setOfflineMethod(value as "yape" | "plin" | "transfer")}
            >
              {offlinePaymentMethods.map((method) => (
                <div key={method.code} className="flex items-center space-x-2">
                  <RadioGroupItem value={method.code} id={`method-${method.code}`} />
                  <Label htmlFor={`method-${method.code}`} className="flex items-center">
                    <span className="mr-2">{method.icon}</span>
                    {method.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="bg-muted p-3 rounded-md text-sm">
              {offlineMethod === "yape" && (
                <div>
                  <p className="font-medium">Instrucciones para Yape:</p>
                  <p>1. Abre tu aplicación Yape</p>
                  <p>2. Envía el pago al número: +51 987 654 321</p>
                  <p>3. Adjunta el comprobante de pago a continuación</p>
                </div>
              )}

              {offlineMethod === "plin" && (
                <div>
                  <p className="font-medium">Instrucciones para Plin:</p>
                  <p>1. Abre tu aplicación Plin</p>
                  <p>2. Envía el pago al número: +51 987 654 321</p>
                  <p>3. Adjunta el comprobante de pago a continuación</p>
                </div>
              )}

              {offlineMethod === "transfer" && (
                <div>
                  <p className="font-medium">Instrucciones para transferencia bancaria:</p>
                  <p>Banco: Interbank</p>
                  <p>Cuenta: 123-456-789</p>
                  <p>Titular: RaveHub S.A.C.</p>
                  <p>
                    Concepto: Cuota {installment.installmentNumber} - {user?.firstName} {user?.lastName}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment-proof">Comprobante de pago</Label>
              <div className="flex items-center gap-2">
                <Input id="payment-proof" type="file" accept="image/*" onChange={handleFileChange} className="flex-1" />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Adjunta una captura de pantalla o foto de tu comprobante de pago
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Enviar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
