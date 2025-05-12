"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CalendarIcon, Upload, Save, Edit, X, FileText, ExternalLink, Search } from "lucide-react"
import type { TicketTransaction } from "@/types"
import { formatDate } from "@/lib/utils"
import Image from "next/image"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { updateTicketDownloadDate, uploadTicketPdf, updateTicketTransaction } from "@/lib/firebase/tickets"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { updateTicketPdf } from "@/lib/firebase/tickets"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getFirestore, collection, query, where, getDocs, limit } from "firebase/firestore"
import { app } from "@/lib/firebase/config"

interface TicketDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TicketTransaction
}

export function TicketDetailsModal({ isOpen, onClose, transaction }: TicketDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [imageError, setImageError] = useState(false)
  const [downloadDate, setDownloadDate] = useState<Date | undefined>(
    transaction.ticketsDownloadAvailableDate ? new Date(transaction.ticketsDownloadAvailableDate) : undefined,
  )
  const [ticketFile, setTicketFile] = useState<File | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTransaction, setEditedTransaction] = useState<Partial<TicketTransaction>>({})
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  // Add these useState hooks after the existing ones
  const [isEditingNominations, setIsEditingNominations] = useState<Record<string, boolean>>({})
  const [nomineeDataMap, setNomineeDataMap] = useState<Record<string, any>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [localTransaction, setLocalTransaction] = useState<TicketTransaction>(transaction)

  // Asegurar que downloadDate sea válido al inicializar y cuando cambia transaction
  useEffect(() => {
    setLocalTransaction(transaction)

    // Inicializar fecha de descarga
    if (transaction.ticketsDownloadAvailableDate) {
      try {
        let dateValue: Date
        if (typeof transaction.ticketsDownloadAvailableDate === "string") {
          dateValue = new Date(transaction.ticketsDownloadAvailableDate)
        } else if (transaction.ticketsDownloadAvailableDate instanceof Date) {
          dateValue = transaction.ticketsDownloadAvailableDate
        } else if (
          transaction.ticketsDownloadAvailableDate &&
          typeof transaction.ticketsDownloadAvailableDate.toDate === "function"
        ) {
          dateValue = transaction.ticketsDownloadAvailableDate.toDate()
        } else {
          throw new Error("Invalid date format")
        }

        if (!isNaN(dateValue.getTime())) {
          setDownloadDate(dateValue)
        } else {
          setDownloadDate(undefined)
        }
      } catch (error) {
        console.error("Error parsing date:", error)
        setDownloadDate(undefined)
      }
    } else {
      setDownloadDate(undefined)
    }

    // Inicializar estado de edición
    setEditedTransaction({
      adminNotes: transaction.adminNotes || "",
      currency: transaction.currency || "USD",
      isCourtesy: transaction.isCourtesy || false,
      offlinePaymentMethod: transaction.offlinePaymentMethod || "transfer",
      paymentStatus: transaction.paymentStatus || "pending",
      paymentType: transaction.paymentType || "full",
      totalAmount: transaction.totalAmount || 0,
    })

    // Inicializar datos de nominación
    const initialNomineeData: Record<string, any> = {}
    const initialEditingState: Record<string, boolean> = {}

    transaction.ticketItems.forEach((ticket) => {
      initialNomineeData[ticket.id] = {
        nomineeFirstName: ticket.nomineeFirstName || "",
        nomineeLastName: ticket.nomineeLastName || "",
        nomineeDocType: ticket.nomineeDocType || "dni",
        nomineeDocNumber: ticket.nomineeDocNumber || "",
        searchResults: [],
      }
      initialEditingState[ticket.id] = false
    })

    setNomineeDataMap(initialNomineeData)
    setIsEditingNominations(initialEditingState)
  }, [transaction])

  useEffect(() => {
    if (!isOpen) {
      setTicketFile(null)
      setSelectedTicketId(null)
      setUploadProgress(0)
      setIsUploading(false)
      setImageError(false)
      setActiveTab("details")
    }
  }, [isOpen])

  const handleEditChange = (field: string, value: any) => {
    setEditedTransaction((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveChanges = async () => {
    try {
      setIsUpdating(true)

      // Validar datos antes de guardar
      if (editedTransaction.totalAmount !== undefined && editedTransaction.totalAmount <= 0) {
        toast({
          title: "Error",
          description: "El monto total debe ser mayor que cero",
          variant: "destructive",
        })
        return
      }

      await updateTicketTransaction(transaction.id, editedTransaction)

      // Actualizar el estado local con los cambios
      setLocalTransaction((prev) => ({
        ...prev,
        ...editedTransaction,
      }))

      toast({
        title: "Cambios guardados",
        description: "Los cambios han sido guardados exitosamente",
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validar tipo de archivo
      if (file.type !== "application/pdf") {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF",
          variant: "destructive",
        })
        e.target.value = ""
        return
      }

      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo no debe superar los 5MB",
          variant: "destructive",
        })
        e.target.value = ""
        return
      }

      setTicketFile(file)
    }
  }

  const handleUpdateDownloadDate = async () => {
    if (!downloadDate) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha de descarga",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdating(true)
      await updateTicketDownloadDate(transaction.id, downloadDate)

      // Actualizar el estado local
      setLocalTransaction((prev) => ({
        ...prev,
        ticketsDownloadAvailableDate: downloadDate,
      }))

      toast({
        title: "Fecha actualizada",
        description: "La fecha de descarga ha sido actualizada exitosamente",
      })
    } catch (error) {
      console.error("Error updating download date:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar la fecha de descarga",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Update the handleUploadTicket function to ensure it updates the ticket within the transaction
  const handleUploadTicket = async (ticketItemId: string) => {
    if (!ticketFile) {
      toast({
        title: "Error",
        description: "Debes seleccionar un archivo PDF",
        variant: "destructive",
      })
      return
    }

    // Validar tipo de archivo
    if (ticketFile.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      // Generar un ID único para el archivo PDF
      const uniqueFileId = crypto.randomUUID()
      const ticketPdfUrl = await uploadTicketPdf(
        ticketFile,
        `tickets/${transaction.userId}/${transaction.id}/${ticketItemId}_${uniqueFileId}.pdf`,
      )

      // Actualizar el ticketPdfUrl en la base de datos
      await updateTicketPdf(transaction.id, ticketItemId, ticketPdfUrl)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Actualizar el estado local
      setLocalTransaction((prev) => ({
        ...prev,
        ticketItems: prev.ticketItems.map((item) =>
          item.id === ticketItemId ? { ...item, ticketPdfUrl, updatedAt: new Date() } : item,
        ),
      }))

      toast({
        title: "Ticket actualizado",
        description: "El PDF del ticket ha sido actualizado exitosamente",
      })

      // Limpiar estados
      setTimeout(() => {
        setTicketFile(null)
        setSelectedTicketId(null)
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
    } catch (error) {
      console.error("Error uploading ticket:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al subir el PDF del ticket",
        variant: "destructive",
      })
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Función segura para formatear fechas
  const safeFormatDate = (date: Date | undefined | null | string) => {
    if (!date) return "Seleccionar fecha"

    try {
      // Convertir a objeto Date si es string
      const dateObj = typeof date === "string" ? new Date(date) : date

      // Verificar si la fecha es válida
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        return format(dateObj, "PPP", { locale: es })
      }
      return "Seleccionar fecha"
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Seleccionar fecha"
    }
  }

  const saveNomination = async (ticket) => {
    if (
      !nomineeDataMap[ticket.id].nomineeFirstName ||
      !nomineeDataMap[ticket.id].nomineeLastName ||
      !nomineeDataMap[ticket.id].nomineeDocNumber
    ) {
      toast({
        title: "Error",
        description: "Todos los campos de nominación son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdating(true)

      // Crear ticket actualizado con datos de nominación
      const updatedTicket = {
        ...ticket,
        isNominated: true,
        nomineeFirstName: nomineeDataMap[ticket.id].nomineeFirstName,
        nomineeLastName: nomineeDataMap[ticket.id].nomineeLastName,
        nomineeDocType: nomineeDataMap[ticket.id].nomineeDocType,
        nomineeDocNumber: nomineeDataMap[ticket.id].nomineeDocNumber,
        updatedAt: new Date().toISOString(),
      }

      // Encontrar el índice del ticket en la transacción
      const ticketIndex = localTransaction.ticketItems.findIndex((t) => t.id === ticket.id)
      const updatedTicketItems = [...localTransaction.ticketItems]
      updatedTicketItems[ticketIndex] = updatedTicket

      // Actualizar la transacción en la base de datos
      await updateTicketTransaction(transaction.id, {
        ticketItems: updatedTicketItems,
      })

      // Actualizar el estado local
      setLocalTransaction((prev) => ({
        ...prev,
        ticketItems: updatedTicketItems,
      }))

      toast({
        title: "Nominación actualizada",
        description: "La nominación ha sido actualizada exitosamente",
      })

      setIsEditingNominations((prev) => ({
        ...prev,
        [ticket.id]: false,
      }))
    } catch (error) {
      console.error("Error updating nomination:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar la nominación",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const removeNomination = async (ticket) => {
    try {
      setIsUpdating(true)

      // Crear ticket actualizado sin datos de nominación
      const updatedTicket = {
        ...ticket,
        isNominated: false,
        nomineeFirstName: "",
        nomineeLastName: "",
        nomineeDocType: "",
        nomineeDocNumber: "",
        updatedAt: new Date().toISOString(),
      }

      // Encontrar el índice del ticket en la transacción
      const ticketIndex = localTransaction.ticketItems.findIndex((t) => t.id === ticket.id)
      const updatedTicketItems = [...localTransaction.ticketItems]
      updatedTicketItems[ticketIndex] = updatedTicket

      // Actualizar la transacción en la base de datos
      await updateTicketTransaction(transaction.id, {
        ticketItems: updatedTicketItems,
      })

      // Actualizar el estado local
      setLocalTransaction((prev) => ({
        ...prev,
        ticketItems: updatedTicketItems,
      }))

      // Actualizar el estado de nominación
      setNomineeDataMap((prev) => ({
        ...prev,
        [ticket.id]: {
          nomineeFirstName: "",
          nomineeLastName: "",
          nomineeDocType: "dni",
          nomineeDocNumber: "",
          searchResults: [],
        },
      }))

      toast({
        title: "Nominación eliminada",
        description: "La nominación ha sido eliminada exitosamente",
      })
    } catch (error) {
      console.error("Error removing nomination:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la nominación",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Detalles de la transacción</DialogTitle>
          <DialogDescription>ID: {localTransaction.id}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="user">Usuario</TabsTrigger>
            <TabsTrigger value="payment">Comprobante</TabsTrigger>
            <TabsTrigger value="manage">Edit Date</TabsTrigger>
            <TabsTrigger value="nominations">Nominaciones</TabsTrigger>
            <TabsTrigger value="edit">Editar</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Evento</h3>
                <p className="text-base">{localTransaction.event?.name || "Evento"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Estado</h3>
                <div>{getStatusBadge(localTransaction.paymentStatus)}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Fecha de compra</h3>
                <p className="text-base">
                  {localTransaction.createdAt ? formatDate(localTransaction.createdAt) : "Fecha no disponible"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Monto total</h3>
                <p className="text-base">
                  ${localTransaction.totalAmount.toFixed(2)} {localTransaction.currency}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tipo de pago</h3>
                <p className="text-base">
                  {localTransaction.paymentType === "full" ? "Pago completo" : "Pago en cuotas"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Método de pago</h3>
                <p className="text-base">
                  {localTransaction.offlinePaymentMethod === "yape"
                    ? "Yape"
                    : localTransaction.offlinePaymentMethod === "plin"
                      ? "Plin"
                      : "Transferencia bancaria"}
                </p>
              </div>
              {localTransaction.isCourtesy && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Tipo de entrada</h3>
                  <Badge variant="secondary" className="mt-1">
                    Cortesía
                  </Badge>
                </div>
              )}
              {localTransaction.adminNotes && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Notas administrativas</h3>
                  <p className="text-base">{localTransaction.adminNotes}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">Entradas</h3>
              <div className="space-y-2">
                {localTransaction.ticketItems.map((ticket, index) => (
                  <div key={ticket.id} className="border rounded-md p-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Entrada {index + 1}</p>
                        <p className="text-sm text-muted-foreground">Zona: {ticket.zone?.name || "Zona"}</p>
                        {ticket.isNominated && (
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground">Nominada a:</p>
                            <p className="text-sm">
                              {ticket.nomineeFirstName} {ticket.nomineeLastName} - {ticket.nomineeDocType}:{" "}
                              {ticket.nomineeDocNumber}
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm">
                          ${ticket.price.toFixed(2)} {localTransaction.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {localTransaction.paymentType === "installment" && localTransaction.installments && (
              <>
                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">Cuotas</h3>
                  <div className="space-y-2">
                    {localTransaction.installments.map((installment) => (
                      <div key={installment.id} className="border rounded-md p-3">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">
                              Cuota {installment.installmentNumber} de {localTransaction.numberOfInstallments}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Vencimiento:{" "}
                              {installment.dueDate ? formatDate(installment.dueDate) : "Fecha no disponible"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-sm">
                              ${installment.amount.toFixed(2)} {localTransaction.currency}
                            </p>
                            {getStatusBadge(installment.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="user" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
                <p className="text-base">
                  {localTransaction.user?.firstName} {localTransaction.user?.lastName}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p className="text-base">{localTransaction.user?.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Teléfono</h3>
                <p className="text-base">
                  {localTransaction.user?.phonePrefix} {localTransaction.user?.phone}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">País</h3>
                <p className="text-base">{localTransaction.user?.country}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Documento</h3>
                <p className="text-base">
                  {localTransaction.user?.documentType} {localTransaction.user?.documentNumber}
                </p>
              </div>
              {localTransaction.reviewedBy && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Revisado por</h3>
                  <p className="text-base">{localTransaction.reviewedBy}</p>
                </div>
              )}
              {localTransaction.reviewedAt && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fecha de revisión</h3>
                  <p className="text-base">{formatDate(localTransaction.reviewedAt)}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            {localTransaction.paymentProofUrl ? (
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
                      src={localTransaction.paymentProofUrl || "/placeholder.svg"}
                      alt="Comprobante de pago"
                      fill
                      className="object-contain"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => window.open(localTransaction.paymentProofUrl, "_blank")}>
                    Ver en tamaño completo
                  </Button>
                  {localTransaction.paymentStatus === "pending" && (
                    <Button
                      variant="default"
                      onClick={() => {
                        onClose()
                        // Dar tiempo para que el modal se cierre antes de abrir el siguiente
                        setTimeout(() => {
                          document
                            .querySelector(`[data-transaction-id="${transaction.id}"] [data-action="approve"]`)
                            ?.click()
                        }, 100)
                      }}
                    >
                      Aprobar pago
                    </Button>
                  )}
                </div>
              </div>
            ) : localTransaction.isCourtesy ? (
              <div className="text-center py-8">
                <Badge variant="secondary" className="mb-2">
                  Cortesía
                </Badge>
                <p className="text-muted-foreground">
                  Esta transacción es una cortesía y no requiere comprobante de pago
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay comprobante de pago disponible</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="manage" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fecha de descarga</h3>
              <p className="text-sm text-muted-foreground">
                Selecciona la fecha a partir de la cual el usuario podrá descargar sus tickets.
              </p>
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !downloadDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {safeFormatDate(downloadDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={downloadDate}
                      onSelect={setDownloadDate}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <Button onClick={handleUpdateDownloadDate} disabled={isUpdating || !downloadDate}>
                  {isUpdating ? "Actualizando..." : "Actualizar fecha de descarga"}
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="nominations" className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Gestión de Nominaciones</h3>
            </div>

            <div className="space-y-4">
              {localTransaction.ticketItems.map((ticket, index) => {
                const handleNomineeChange = (field: string, value: string) => {
                  setNomineeDataMap((prev) => ({
                    ...prev,
                    [ticket.id]: {
                      ...prev[ticket.id],
                      [field]: value,
                    },
                  }))
                }

                return (
                  <div key={ticket.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-medium">Entrada {index + 1}</h4>
                        <p className="text-sm text-muted-foreground">Zona: {ticket.zone?.name || "Zona"}</p>
                      </div>
                      <div>
                        {ticket.isNominated ? (
                          <Badge variant="outline" className="bg-green-50">
                            Nominada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50">
                            Sin nominar
                          </Badge>
                        )}
                      </div>
                    </div>

                    {ticket.isNominated && !isEditingNominations[ticket.id] ? (
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Nombre</p>
                            <p className="text-sm">{ticket.nomineeFirstName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Apellido</p>
                            <p className="text-sm">{ticket.nomineeLastName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo de documento</p>
                            <p className="text-sm">{ticket.nomineeDocType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Número de documento</p>
                            <p className="text-sm">{ticket.nomineeDocNumber}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingNominations((prev) => ({ ...prev, [ticket.id]: true }))}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar nominación
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeNomination(ticket)}
                            disabled={isUpdating}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Eliminar nominación
                          </Button>
                        </div>
                      </div>
                    ) : isEditingNominations[ticket.id] || !ticket.isNominated ? (
                      <div className="mt-2 space-y-3">
                        {/* Add user search functionality */}
                        <div className="space-y-2 border-b pb-3">
                          <Label htmlFor={`userSearch-${ticket.id}`}>Buscar usuario existente</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id={`userSearch-${ticket.id}`}
                                placeholder="Buscar por nombre, email o documento"
                                className="pl-8"
                                onChange={async (e) => {
                                  if (e.target.value.length < 3) return

                                  try {
                                    const db = getFirestore(app)
                                    const usersRef = collection(db, "users")
                                    const searchTerm = e.target.value.toLowerCase()

                                    // Mostrar indicador de carga
                                    setNomineeDataMap((prev) => ({
                                      ...prev,
                                      [ticket.id]: {
                                        ...prev[ticket.id],
                                        isSearching: true,
                                        searchResults: [],
                                      },
                                    }))

                                    // Realizar búsquedas en paralelo
                                    const [nameResults, emailResults, docResults, lastNameResults] = await Promise.all([
                                      getDocs(
                                        query(
                                          usersRef,
                                          where("firstName", ">=", searchTerm),
                                          where("firstName", "<=", searchTerm + "\uf8ff"),
                                          limit(5),
                                        ),
                                      ).catch(() => ({ docs: [] })),
                                      getDocs(
                                        query(
                                          usersRef,
                                          where("email", ">=", searchTerm),
                                          where("email", "<=", searchTerm + "\uf8ff"),
                                          limit(5),
                                        ),
                                      ).catch(() => ({ docs: [] })),
                                      getDocs(
                                        query(
                                          usersRef,
                                          where("documentNumber", ">=", searchTerm),
                                          where("documentNumber", "<=", searchTerm + "\uf8ff"),
                                          limit(5),
                                        ),
                                      ).catch(() => ({ docs: [] })),
                                      getDocs(
                                        query(
                                          usersRef,
                                          where("lastName", ">=", searchTerm),
                                          where("lastName", "<=", searchTerm + "\uf8ff"),
                                          limit(5),
                                        ),
                                      ).catch(() => ({ docs: [] })),
                                    ])

                                    // Combinar resultados y eliminar duplicados
                                    const userMap = new Map()
                                    ;[
                                      ...nameResults.docs,
                                      ...emailResults.docs,
                                      ...docResults.docs,
                                      ...lastNameResults.docs,
                                    ].forEach((doc) => {
                                      if (!userMap.has(doc.id)) {
                                        userMap.set(doc.id, { id: doc.id, ...doc.data() })
                                      }
                                    })

                                    const searchResults = Array.from(userMap.values())

                                    // Actualizar estado con resultados de búsqueda
                                    setNomineeDataMap((prev) => ({
                                      ...prev,
                                      [ticket.id]: {
                                        ...prev[ticket.id],
                                        searchResults,
                                        isSearching: false,
                                      },
                                    }))
                                  } catch (error) {
                                    console.error("Error searching users:", error)
                                    toast({
                                      title: "Error",
                                      description: "Ocurrió un error al buscar usuarios",
                                      variant: "destructive",
                                    })
                                    setNomineeDataMap((prev) => ({
                                      ...prev,
                                      [ticket.id]: {
                                        ...prev[ticket.id],
                                        isSearching: false,
                                      },
                                    }))
                                  }
                                }}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Clear search results
                                setNomineeDataMap((prev) => ({
                                  ...prev,
                                  [ticket.id]: {
                                    ...prev[ticket.id],
                                    searchResults: [],
                                  },
                                }))
                              }}
                            >
                              Limpiar
                            </Button>
                          </div>

                          {/* Search results */}
                          {nomineeDataMap[ticket.id]?.searchResults?.length > 0 && (
                            <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                              <div className="p-1 space-y-1">
                                {nomineeDataMap[ticket.id].searchResults.map((user: any) => (
                                  <div
                                    key={user.id}
                                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                                    onClick={() => {
                                      // Fill form with selected user data
                                      setNomineeDataMap((prev) => ({
                                        ...prev,
                                        [ticket.id]: {
                                          ...prev[ticket.id],
                                          nomineeFirstName: user.firstName || "",
                                          nomineeLastName: user.lastName || "",
                                          nomineeDocType: user.documentType?.toLowerCase() || "dni",
                                          nomineeDocNumber: user.documentNumber || "",
                                          searchResults: [], // Clear search results after selection
                                        },
                                      }))
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      {user.photoURL ? (
                                        <div className="w-8 h-8 rounded-full overflow-hidden">
                                          <img
                                            src={user.photoURL || "/placeholder.svg"}
                                            alt={user.firstName}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                          <span className="text-xs font-medium">
                                            {user.firstName?.[0]}
                                            {user.lastName?.[0]}
                                          </span>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-sm font-medium">
                                          {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {user.documentType}: {user.documentNumber}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Manual entry form - keep the existing form */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor={`firstName-${ticket.id}`}>Nombre</Label>
                            <Input
                              id={`firstName-${ticket.id}`}
                              value={nomineeDataMap[ticket.id]?.nomineeFirstName || ""}
                              onChange={(e) => handleNomineeChange("nomineeFirstName", e.target.value)}
                              placeholder="Nombre"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`lastName-${ticket.id}`}>Apellido</Label>
                            <Input
                              id={`lastName-${ticket.id}`}
                              value={nomineeDataMap[ticket.id]?.nomineeLastName || ""}
                              onChange={(e) => handleNomineeChange("nomineeLastName", e.target.value)}
                              placeholder="Apellido"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`docType-${ticket.id}`}>Tipo de documento</Label>
                            <Select
                              value={nomineeDataMap[ticket.id]?.nomineeDocType || "dni"}
                              onValueChange={(value) => handleNomineeChange("nomineeDocType", value)}
                            >
                              <SelectTrigger id={`docType-${ticket.id}`}>
                                <SelectValue placeholder="Tipo de documento" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dni">DNI</SelectItem>
                                <SelectItem value="passport">Pasaporte</SelectItem>
                                <SelectItem value="foreignId">Carnet de Extranjería</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`docNumber-${ticket.id}`}>Número de documento</Label>
                            <Input
                              id={`docNumber-${ticket.id}`}
                              value={nomineeDataMap[ticket.id]?.nomineeDocNumber || ""}
                              onChange={(e) => handleNomineeChange("nomineeDocNumber", e.target.value)}
                              placeholder="Número de documento"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {isEditingNominations[ticket.id] ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditingNominations((prev) => ({ ...prev, [ticket.id]: false }))}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => saveNomination(ticket)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? "Guardando..." : "Guardar cambios"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => saveNomination(ticket)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? "Nominando..." : "Nominar entrada"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </TabsContent>
          <TabsContent value="edit" className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Editar información</h3>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSaveChanges} disabled={isUpdating}>
                      <Save className="h-4 w-4 mr-1" />
                      {isUpdating ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="adminNotes">Notas administrativas</Label>
                <Textarea
                  id="adminNotes"
                  value={editedTransaction.adminNotes || ""}
                  onChange={(e) => handleEditChange("adminNotes", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Agregar notas administrativas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currency">Divisa</Label>
                  <Select
                    value={editedTransaction.currency || "USD"}
                    onValueChange={(value) => handleEditChange("currency", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Seleccionar divisa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="PEN">PEN - Sol Peruano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="totalAmount">Monto total</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={editedTransaction.totalAmount || 0}
                    onChange={(e) => handleEditChange("totalAmount", Number.parseFloat(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentStatus">Estado de pago</Label>
                  <Select
                    value={editedTransaction.paymentStatus || "pending"}
                    onValueChange={(value) => handleEditChange("paymentStatus", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="paymentStatus">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="paymentType">Tipo de pago</Label>
                  <Select
                    value={editedTransaction.paymentType || "full"}
                    onValueChange={(value) => handleEditChange("paymentType", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="paymentType">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Pago completo</SelectItem>
                      <SelectItem value="installment">Pago en cuotas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="offlinePaymentMethod">Método de pago</Label>
                  <Select
                    value={editedTransaction.offlinePaymentMethod || "transfer"}
                    onValueChange={(value) => handleEditChange("offlinePaymentMethod", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="offlinePaymentMethod">
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                      <SelectItem value="yape">Yape</SelectItem>
                      <SelectItem value="plin">Plin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isCourtesy">¿Es cortesía?</Label>
                    <Switch
                      id="isCourtesy"
                      checked={editedTransaction.isCourtesy || false}
                      onCheckedChange={(checked) => handleEditChange("isCourtesy", checked)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Archivos PDF de tickets</h3>
                <div className="grid gap-4">
                  {localTransaction.ticketItems.map((ticket, index) => (
                    <div key={ticket.id} className="border rounded-md p-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">Ticket {index + 1}</p>
                            {ticket.isNominated && (
                              <p className="text-xs text-muted-foreground">
                                {ticket.nomineeFirstName} {ticket.nomineeLastName}
                              </p>
                            )}
                          </div>
                          {ticket.ticketPdfUrl ? (
                            <Badge variant="outline" className="bg-green-50">
                              PDF disponible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50">
                              Sin PDF
                            </Badge>
                          )}
                        </div>

                        {ticket.ticketPdfUrl ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden max-w-[300px]">
                              <span className="text-sm text-muted-foreground truncate">{ticket.ticketPdfUrl}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(ticket.ticketPdfUrl, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Ver PDF
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(ticket.id)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Editar PDF
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Este ticket no tiene un PDF asociado</span>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(ticket.id)}>
                              <Upload className="h-4 w-4 mr-1" />
                              Subir PDF
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTicketId && (
                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">
                      {localTransaction.ticketItems.find((t) => t.id === selectedTicketId)?.ticketPdfUrl
                        ? "Reemplazar PDF del ticket"
                        : "Subir nuevo PDF del ticket"}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTicketId(null)
                        setTicketFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="w-full"
                      disabled={isUploading}
                    />

                    {isUploading && (
                      <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}

                    <Button
                      variant="default"
                      onClick={() => handleUploadTicket(selectedTicketId)}
                      disabled={isUploading || !ticketFile}
                    >
                      {isUploading ? (
                        <>
                          <span className="animate-spin mr-2">
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          </span>
                          Subiendo {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          Subir PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
