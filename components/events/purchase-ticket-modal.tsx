"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, calculateInstallmentDates } from "@/lib/utils"
import type { Event, Zone, SalesPhase, TicketTransaction, TicketItem, PaymentInstallment } from "@/types"
import { offlinePaymentMethods, installmentFrequencies } from "@/lib/constants"
import {
  CalendarClock,
  CalendarDays,
  Clock,
  CreditCard,
  DollarSign,
  FileImage,
  Globe,
  Hash,
  Info,
  Receipt,
  ShoppingCart,
  Ticket,
  Upload,
  Wallet,
  X,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createTicketTransaction, uploadPaymentProof } from "@/lib/firebase/tickets"
import { v4 as uuidv4 } from "uuid"
import Image from "next/image"

interface PurchaseTicketModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event
  zone: Zone
  phase: SalesPhase
}

export function PurchaseTicketModal({ isOpen, onClose, event, zone, phase }: PurchaseTicketModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { currency, exchangeRates } = useCurrency()

  const [quantity, setQuantity] = useState(1)
  const [paymentType, setPaymentType] = useState<"full" | "installment">("full")
  const [paymentMethod, setPaymentMethod] = useState<"online" | "offline">("offline")
  const [offlineMethod, setOfflineMethod] = useState<"yape" | "plin" | "transfer">("yape")
  const [installments, setInstallments] = useState(2)
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("monthly")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get pricing for the selected zone
  const zonePricing = phase.zonesPricing.find((p) => p.zoneId === zone.id)
  const unitPrice = zonePricing?.price || 0
  const totalPrice = unitPrice * quantity

  // Calculate installment amounts
  const installmentAmount = totalPrice / installments

  // Calculate installment dates
  const installmentDates = calculateInstallmentDates(new Date(), installments, frequency)

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0])
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para comprar entradas",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "offline" && !paymentProof) {
      toast({
        title: "Error",
        description: "Debes adjuntar un comprobante de pago",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Generate transaction ID
      const transactionId = uuidv4()

      // Upload payment proof if provided
      let paymentProofUrl = ""
      if (paymentProof) {
        paymentProofUrl = await uploadPaymentProof(
          paymentProof,
          `payment-proofs/${user.id}/${transactionId}/${paymentProof.name}`,
        )
      }

      // Create ticket items
      const ticketItems: TicketItem[] = []
      for (let i = 0; i < quantity; i++) {
        ticketItems.push({
          id: uuidv4(),
          transactionId,
          eventId: event.id,
          zoneId: zone.id,
          phaseId: phase.id,
          price: unitPrice,
          currency: event.currency,
          status: "pending",
          isNominated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      // Create payment installments if applicable
      const paymentInstallments: PaymentInstallment[] = []
      if (paymentType === "installment") {
        installmentDates.forEach((date, index) => {
          paymentInstallments.push({
            id: uuidv4(),
            transactionId,
            installmentNumber: index + 1,
            amount: installmentAmount,
            currency: event.currency,
            dueDate: date,
            status: index === 0 ? "pending" : "pending", // First installment will be marked as pending until approved
            adminApproved: false,
          })
        })
      }

      // Create transaction object
      const transaction: TicketTransaction = {
        id: transactionId,
        userId: user.id,
        eventId: event.id,
        createdAt: new Date(),
        totalAmount: totalPrice,
        currency: event.currency,
        paymentMethod,
        paymentStatus: "pending",
        paymentType,
        offlinePaymentMethod: offlineMethod,
        paymentProofUrl,
        ticketItems,
        ...(paymentType === "installment" && {
          numberOfInstallments: installments,
          installmentFrequency: frequency,
        }),
      }

      // Save transaction to Firestore
      await createTicketTransaction(transaction, paymentInstallments)

      toast({
        title: "¡Compra enviada!",
        description: "Tu solicitud de compra ha sido enviada y está pendiente de aprobación.",
      })

      // Close modal and redirect to profile
      onClose()
      router.push("/perfil/entradas")
    } catch (error) {
      console.error("Error submitting purchase:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu compra. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 md:p-6 mx-auto my-4 rounded-xl">
        <DialogHeader>
          <DialogTitle>Comprar entradas</DialogTitle>
          <DialogDescription>
            {event.name} - Zona {zone.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2 max-h-[calc(90vh-180px)] overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid gap-2 bg-muted/30 p-3 rounded-lg border border-muted">
            <Label htmlFor="quantity" className="text-sm font-medium flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" />
              Cantidad de entradas
            </Label>
            <Select value={quantity.toString()} onValueChange={(value) => setQuantity(Number.parseInt(value))}>
              <SelectTrigger id="quantity" className="bg-background">
                <SelectValue placeholder="Selecciona cantidad" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(10)].map((_, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 bg-muted/30 p-3 rounded-lg border border-muted">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Tipo de pago
            </Label>
            <RadioGroup
              value={paymentType}
              onValueChange={(value) => setPaymentType(value as "full" | "installment")}
              className="grid grid-cols-2 gap-2 pt-1"
            >
              <Label
                htmlFor="full"
                className={`flex items-center justify-center p-2 rounded-md border cursor-pointer transition-colors ${
                  paymentType === "full" ? "bg-primary/10 border-primary" : "bg-background hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="full" id="full" className="sr-only" />
                <DollarSign className="h-4 w-4 mr-2" />
                <span>Pago completo</span>
              </Label>
              {event.allowInstallmentPayments && (
                <Label
                  htmlFor="installment"
                  className={`flex items-center justify-center p-2 rounded-md border cursor-pointer transition-colors ${
                    paymentType === "installment" ? "bg-primary/10 border-primary" : "bg-background hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value="installment" id="installment" className="sr-only" />
                  <CalendarClock className="h-4 w-4 mr-2" />
                  <span>Pago en cuotas</span>
                </Label>
              )}
            </RadioGroup>
          </div>

          {paymentType === "installment" && (
            <div className="grid gap-4 bg-muted/30 p-3 rounded-lg border border-muted">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="installments" className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    Número de cuotas
                  </Label>
                  <Select
                    value={installments.toString()}
                    onValueChange={(value) => setInstallments(Number.parseInt(value))}
                  >
                    <SelectTrigger id="installments" className="bg-background">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 6, 12].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} cuotas
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frequency" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Frecuencia
                  </Label>
                  <Select
                    value={frequency}
                    onValueChange={(value) => setFrequency(value as "weekly" | "biweekly" | "monthly")}
                  >
                    <SelectTrigger id="frequency" className="bg-background">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {installmentFrequencies.map((freq) => (
                        <SelectItem key={freq.code} value={freq.code}>
                          {freq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-background p-4 rounded-md border shadow-sm">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-primary">
                  <CalendarDays className="h-4 w-4" />
                  Calendario de pagos
                </h4>
                <ul className="space-y-3 text-sm">
                  {installmentDates.map((date, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center p-2 rounded-md bg-muted/30 border border-muted/50"
                    >
                      <div className="flex items-center">
                        <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center mr-2 font-medium">
                          {index + 1}
                        </div>
                        <span>{new Intl.DateTimeFormat("es-ES").format(date)}</span>
                      </div>
                      <span className="font-medium bg-primary/5 text-primary px-2 py-1 rounded-md">
                        {formatCurrency(installmentAmount, event.currency, currency, exchangeRates)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="grid gap-2 bg-muted/30 p-3 rounded-lg border border-muted">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Método de pago
            </Label>
            <Tabs
              defaultValue="offline"
              onValueChange={(value) => setPaymentMethod(value as "online" | "offline")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger
                  value="offline"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pago offline
                </TabsTrigger>
                <TabsTrigger value="online" disabled className="relative">
                  <Globe className="h-4 w-4 mr-2" />
                  Pago online
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] px-1 rounded-full">
                    Pronto
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="offline" className="mt-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {offlinePaymentMethods.map((method) => (
                    <Label
                      key={method.code}
                      htmlFor={method.code}
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-colors ${
                        offlineMethod === method.code
                          ? "bg-primary/10 border-primary"
                          : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroup
                        value={offlineMethod}
                        onValueChange={(value) => setOfflineMethod(value as "yape" | "plin" | "transfer")}
                        className="hidden"
                      >
                        <RadioGroupItem value={method.code} id={method.code} className="sr-only" />
                      </RadioGroup>
                      <div className="h-12 w-12 relative mb-2">
                        {method.code === "yape" && (
                          <Image src="/images/yape-logo.png" alt="Yape" fill className="object-contain rounded-md" />
                        )}
                        {method.code === "plin" && (
                          <Image src="/images/plin-logo.png" alt="Plin" fill className="object-contain rounded-md" />
                        )}
                        {method.code === "transfer" && (
                          <Image
                            src="/images/interbank-logo.png"
                            alt="Interbank"
                            fill
                            className="object-contain rounded-md"
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium">{method.name}</span>
                    </Label>
                  ))}
                </div>

                <div className="bg-background p-4 rounded-md border shadow-sm">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-primary">
                    <Info className="h-4 w-4" />
                    Instrucciones de pago
                  </h4>
                  <div className="space-y-2 text-sm">
                    {offlineMethod === "yape" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm font-medium text-primary">
                          <div className="h-10 w-10 relative">
                            <Image src="/images/yape-logo.png" alt="Yape" fill className="object-contain rounded-md" />
                          </div>
                          <div>
                            <p>Yape al número:</p>
                            <p className="bg-primary/10 px-2 py-1 rounded-md mt-1">+51 944784488</p>
                          </div>
                        </div>
                        <ol className="space-y-2 pl-5 list-decimal">
                          <li>Abre tu aplicación Yape</li>
                          <li>
                            Envía el pago exacto de{" "}
                            <span className="font-medium">
                              {formatCurrency(totalPrice, event.currency, currency, exchangeRates)}
                            </span>
                          </li>
                          <li>También puedes plinear al +51 944784488</li>
                          <li>Nombre: Percy Tuncar</li>
                          <li>Toma una captura de pantalla del comprobante</li>
                          <li>Adjunta el comprobante a continuación</li>
                        </ol>
                      </div>
                    )}

                    {offlineMethod === "plin" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm font-medium text-primary">
                          <div className="h-10 w-10 relative">
                            <Image src="/images/plin-logo.png" alt="Plin" fill className="object-contain rounded-md" />
                          </div>
                          <div>
                            <p>Plin al número:</p>
                            <p className="bg-primary/10 px-2 py-1 rounded-md mt-1">+51 944784488</p>
                          </div>
                        </div>
                        <ol className="space-y-2 pl-5 list-decimal">
                          <li>Abre tu aplicación Plin</li>
                          <li>
                            Envía el pago exacto de{" "}
                            <span className="font-medium">
                              {formatCurrency(totalPrice, event.currency, currency, exchangeRates)}
                            </span>
                          </li>
                          <li>Nombre: Percy Tuncar</li>
                          <li>Toma una captura de pantalla del comprobante</li>
                          <li>Adjunta el comprobante a continuación</li>
                        </ol>
                      </div>
                    )}

                    {offlineMethod === "transfer" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm font-medium text-primary mb-3">
                          <div className="h-10 w-10 relative">
                            <Image
                              src="/images/interbank-logo.png"
                              alt="Interbank"
                              fill
                              className="object-contain rounded-md"
                            />
                          </div>
                          <div>
                            <p>Transferencia Bancaria</p>
                            <p className="text-xs text-muted-foreground">Interbank</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="bg-muted/30 p-2 rounded-md">
                            <span className="text-xs text-muted-foreground">Banco</span>
                            <p className="font-medium">Interbank</p>
                          </div>
                          <div className="bg-muted/30 p-2 rounded-md">
                            <span className="text-xs text-muted-foreground">Cuenta Simple</span>
                            <p className="font-medium">076 3129312815</p>
                          </div>
                          <div className="bg-muted/30 p-2 rounded-md">
                            <span className="text-xs text-muted-foreground">Titular</span>
                            <p className="font-medium">Percy Tuncar</p>
                          </div>
                          <div className="bg-muted/30 p-2 rounded-md">
                            <span className="text-xs text-muted-foreground">Monto</span>
                            <p className="font-medium">
                              {formatCurrency(totalPrice, event.currency, currency, exchangeRates)}
                            </p>
                          </div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-md">
                          <span className="text-xs text-muted-foreground">CCI</span>
                          <p className="font-medium">00307601312931281576</p>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-md">
                          <span className="text-xs text-muted-foreground">Concepto</span>
                          <p className="font-medium truncate">
                            {event.name} - {user?.firstName} {user?.lastName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-background p-4 rounded-md border shadow-sm">
                  <Label
                    htmlFor="payment-proof"
                    className="text-sm font-medium flex items-center gap-2 text-primary mb-3"
                  >
                    <FileImage className="h-4 w-4" />
                    Comprobante de pago
                  </Label>
                  <div className="relative border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <Input
                      id="payment-proof"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="bg-primary/10 rounded-full p-2">
                        <Upload className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">
                        {paymentProof ? paymentProof.name : "Haz clic para subir tu comprobante"}
                      </p>
                      <p className="text-xs text-muted-foreground">Formatos aceptados: JPG, PNG, JPEG</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="online">
                <div className="py-12 text-center">
                  <div className="bg-muted/30 p-6 rounded-lg border border-muted flex flex-col items-center">
                    <div className="bg-primary/10 rounded-full p-3 mb-3">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Próximamente</h3>
                    <p className="text-muted-foreground">
                      El pago online estará disponible muy pronto. Por ahora, utiliza los métodos offline.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-primary">
              <Receipt className="h-4 w-4" />
              Resumen de compra
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-background rounded-md">
                <span className="text-sm">Evento:</span>
                <span className="font-medium text-sm truncate max-w-[200px]">{event.name}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded-md">
                <span className="text-sm">Zona:</span>
                <span className="font-medium text-sm">{zone.name}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded-md">
                <span className="text-sm">Precio unitario:</span>
                <span className="font-medium text-sm">
                  {formatCurrency(unitPrice, event.currency, currency, exchangeRates)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded-md">
                <span className="text-sm">Cantidad:</span>
                <span className="font-medium text-sm">{quantity}</span>
              </div>
              <div className="h-px bg-primary/20 my-2"></div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md">
                <span className="font-medium">Total a pagar:</span>
                <span className="font-bold text-primary">
                  {formatCurrency(totalPrice, event.currency, currency, exchangeRates)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4 px-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto order-2 sm:order-1">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-1 sm:order-2 bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
                Procesando...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Confirmar compra
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Add custom scrollbar styles
const styles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`

// Add style tag to the component
const styleTag = document.createElement("style")
styleTag.textContent = styles
document.head.appendChild(styleTag)
