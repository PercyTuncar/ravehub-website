"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
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
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getAllEvents } from "@/lib/firebase/events"
import { getAllUsers } from "@/lib/firebase/users"
import { uploadPaymentProof, saveTicketTransaction } from "@/lib/firebase/tickets"
import type { Event, User } from "@/types"
import { installmentFrequencies, offlinePaymentMethods } from "@/lib/constants"
import { toast } from "@/components/ui/use-toast"

interface AssignTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AssignTicketModal({ isOpen, onClose, onSuccess }: AssignTicketModalProps) {
  const { user } = useAuth()

  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")

  const [formData, setFormData] = useState({
    userId: "",
    eventId: "",
    zoneId: "",
    quantity: 1,
    price: 0,
    isCourtesy: false,
    paymentType: "full" as "full" | "installment",
    numberOfInstallments: 2,
    installmentFrequency: "monthly" as "weekly" | "biweekly" | "monthly",
    offlineMethod: "yape" as "yape" | "plin" | "transfer",
    currency: "USD" as "USD" | "PEN" | "EUR",
  })

  const [downloadDate, setDownloadDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from now
  )
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [ticketFiles, setTicketFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch users and events
  useEffect(() => {
    const fetchData = async () => {
      try {
        const allUsers = await getAllUsers()
        const allEvents = await getAllEvents()

        setUsers(allUsers)
        setEvents(allEvents)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  // Update selected event when eventId changes
  useEffect(() => {
    if (formData.eventId) {
      const event = events.find((e) => e.id === formData.eventId) || null
      setSelectedEvent(event)

      // Reset zoneId when event changes
      setFormData((prev) => ({ ...prev, zoneId: "" }))
    } else {
      setSelectedEvent(null)
    }
  }, [formData.eventId, events])

  // Handle form input changes
  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle file upload for payment proof
  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0])
    }
  }

  // Handle file upload for ticket PDFs
  const handleTicketFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setTicketFiles(filesArray)
    }
  }

  // Filter users based on search term
  const filteredUsers = searchTerm.trim()
    ? users.filter(
        (user) =>
          user.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : users

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) return

    // Validate form
    if (!formData.userId || !formData.eventId || !formData.zoneId) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (!formData.isCourtesy && formData.price <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (!downloadDate) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha de descarga",
        variant: "destructive",
      })
      return
    }

    // Asegurarse de que la fecha es válida
    if (!(downloadDate instanceof Date) || isNaN(downloadDate.getTime())) {
      toast({
        title: "Error",
        description: "La fecha de descarga seleccionada no es válida",
        variant: "destructive",
      })
      return
    }

    if (ticketFiles.length === 0) {
      toast({
        title: "Error",
        description: "Debes subir al menos un archivo PDF de ticket",
        variant: "destructive",
      })
      return
    }

    if (ticketFiles.length !== formData.quantity) {
      toast({
        title: "Error",
        description: `Debes subir exactamente ${formData.quantity} archivos PDF (uno por cada entrada)`,
        variant: "destructive",
      })
      return
    }

    if (!formData.isCourtesy && formData.paymentType === "installment" && !paymentProof) {
      toast({
        title: "Error",
        description: "Debes adjuntar un comprobante de pago para la primera cuota",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Upload payment proof if provided
      let paymentProofUrl = ""
      if (paymentProof) {
        paymentProofUrl = await uploadPaymentProof(
          paymentProof,
          `payment-proofs/admin-assigned/${formData.userId}/${formData.eventId}/${paymentProof.name}`,
        )
      }

      // Upload ticket PDFs
      const ticketPdfUrls: string[] = []
      for (let i = 0; i < ticketFiles.length; i++) {
        const file = ticketFiles[i]
        const url = await uploadPaymentProof(
          file,
          `tickets/admin-assigned/${formData.userId}/${formData.eventId}/${i + 1}.pdf`,
        )
        ticketPdfUrls.push(url)
        console.log(`Ticket PDF ${i + 1} uploaded to: ${url}`)
      }

      // Crear la transacción de tickets directamente en ticketTransactions
      const transactionId = crypto.randomUUID()
      const ticketItems = []

      for (let i = 0; i < formData.quantity; i++) {
        ticketItems.push({
          id: crypto.randomUUID(),
          eventId: formData.eventId,
          zoneId: formData.zoneId,
          transactionId: transactionId,
          price: formData.price,
          currency: formData.currency,
          status: "approved",
          isNominated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ticketPdfUrl: ticketPdfUrls[i] || "",
        })
      }

      const transactionData = {
        id: transactionId,
        userId: formData.userId,
        eventId: formData.eventId,
        totalAmount: formData.price * formData.quantity,
        currency: formData.currency,
        paymentMethod: "offline",
        offlinePaymentMethod: formData.offlineMethod,
        paymentStatus: "approved",
        paymentType: formData.paymentType,
        isCourtesy: formData.isCourtesy,
        paymentProofUrl: paymentProofUrl,
        ticketsDownloadAvailableDate: downloadDate.toISOString(),
        createdAt: { _methodName: "serverTimestamp" },
        updatedAt: { _methodName: "serverTimestamp" },
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        adminNotes: formData.isCourtesy ? "Cortesía asignada por administrador" : "Venta asignada por administrador",
        ticketItems: ticketItems,
      }

      // Guardar la transacción en Firestore
      await saveTicketTransaction(transactionData)

      toast({
        title: "Tickets asignados",
        description: "Los tickets han sido asignados exitosamente al usuario.",
      })

      onClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error assigning tickets:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al asignar los tickets.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Asignar tickets a usuario</DialogTitle>
          <DialogDescription>Asigna tickets a un usuario específico (cortesía o venta)</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid gap-2">
            <Label htmlFor="user">Usuario</Label>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Buscar por número de documento, nombre o email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
              <Select value={formData.userId} onValueChange={(value) => handleChange("userId", value)}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} {user.documentNumber ? `(${user.documentNumber})` : ""} -{" "}
                        {user.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-results" disabled>
                      No se encontraron resultados
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="event">Evento</Label>
            <Select value={formData.eventId} onValueChange={(value) => handleChange("eventId", value)}>
              <SelectTrigger id="event">
                <SelectValue placeholder="Selecciona un evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && (
            <div className="grid gap-2">
              <Label htmlFor="zone">Zona</Label>
              <Select value={formData.zoneId} onValueChange={(value) => handleChange("zoneId", value)}>
                <SelectTrigger id="zone">
                  <SelectValue placeholder="Selecciona una zona" />
                </SelectTrigger>
                <SelectContent>
                  {selectedEvent.zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Select
                value={formData.quantity.toString()}
                onValueChange={(value) => handleChange("quantity", Number.parseInt(value))}
              >
                <SelectTrigger id="quantity">
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

            <div className="grid gap-2">
              <Label htmlFor="price">Precio unitario</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange("price", Number.parseFloat(e.target.value))}
                disabled={formData.isCourtesy}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="currency">Divisa</Label>
            <Select value={formData.currency} onValueChange={(value) => handleChange("currency", value)}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Selecciona divisa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                <SelectItem value="PEN">PEN - Sol Peruano</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="courtesy"
              checked={formData.isCourtesy}
              onCheckedChange={(checked) => {
                handleChange("isCourtesy", checked)
                if (checked) {
                  handleChange("price", 0)
                }
              }}
            />
            <Label htmlFor="courtesy">Es cortesía</Label>
          </div>

          {!formData.isCourtesy && (
            <>
              <div className="grid gap-2">
                <Label>Tipo de pago</Label>
                <RadioGroup value={formData.paymentType} onValueChange={(value) => handleChange("paymentType", value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">Pago completo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="installment" id="installment" />
                    <Label htmlFor="installment">Pago en cuotas</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.paymentType === "installment" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="installments">Número de cuotas</Label>
                    <Select
                      value={formData.numberOfInstallments.toString()}
                      onValueChange={(value) => handleChange("numberOfInstallments", Number.parseInt(value))}
                    >
                      <SelectTrigger id="installments">
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
                    <Label htmlFor="frequency">Frecuencia</Label>
                    <Select
                      value={formData.installmentFrequency}
                      onValueChange={(value) => handleChange("installmentFrequency", value)}
                    >
                      <SelectTrigger id="frequency">
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
              )}

              <div className="grid gap-2">
                <Label>Método de pago</Label>
                <RadioGroup
                  value={formData.offlineMethod}
                  onValueChange={(value) => handleChange("offlineMethod", value)}
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
              </div>

              {formData.paymentType === "installment" && (
                <div className="grid gap-2">
                  <Label htmlFor="payment-proof">Comprobante de primera cuota</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="payment-proof"
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentProofChange}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Adjunta el comprobante de pago de la primera cuota</p>
                </div>
              )}
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="download-date">Fecha de descarga</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="download-date"
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !downloadDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {downloadDate ? format(downloadDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={downloadDate}
                  onSelect={setDownloadDate}
                  initialFocus
                  locale={es}
                  disabled={(date) => {
                    // Comparar solo año, mes y día para permitir seleccionar el día actual
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date < today
                  }}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Selecciona la fecha a partir de la cual el usuario podrá descargar sus tickets
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ticket-files">Archivos PDF de tickets</Label>
            <div className="flex items-center gap-2">
              <Input
                id="ticket-files"
                type="file"
                accept=".pdf"
                onChange={handleTicketFilesChange}
                className="flex-1"
                multiple
              />
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sube {formData.quantity} archivos PDF (uno por cada entrada). Estos archivos se guardarán en cada ticket.
            </p>
            {ticketFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Archivos seleccionados ({ticketFiles.length}):</p>
                <ul className="text-xs text-muted-foreground">
                  {ticketFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Asignar tickets"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
