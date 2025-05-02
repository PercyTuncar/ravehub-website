"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
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
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { TicketTransaction } from "@/types"
import { approveTicketTransaction, uploadTicketPdf } from "@/lib/firebase/tickets"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from "next/image"

interface ApproveTicketModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TicketTransaction
  onSuccess?: () => void
}

export function ApproveTicketModal({ isOpen, onClose, transaction, onSuccess }: ApproveTicketModalProps) {
  const { user } = useAuth()

  const [downloadDate, setDownloadDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from now
  )
  const [adminNotes, setAdminNotes] = useState("")
  const [ticketFiles, setTicketFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setTicketFiles(filesArray)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) return

    if (!downloadDate) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha de descarga",
        variant: "destructive",
      })
      return
    }

    // Eliminar la validación que requiere archivos PDF
    // Comentar o eliminar este bloque:
    /*
    if (ticketFiles.length === 0) {
      toast({
        title: "Error",
        description: "Debes subir al menos un archivo PDF de ticket",
        variant: "destructive",
      });
      return;
    }

    if (ticketFiles.length !== transaction.ticketItems.length) {
      toast({
        title: "Error",
        description: `Debes subir exactamente ${transaction.ticketItems.length} archivos PDF (uno por cada entrada)`,
        variant: "destructive",
      });
      return;
    }
    */

    try {
      setIsSubmitting(true)
      setUploadProgress(0)

      // Upload ticket PDFs if provided
      const ticketPdfUrls: string[] = []

      if (ticketFiles.length > 0) {
        const totalFiles = ticketFiles.length

        for (let i = 0; i < ticketFiles.length; i++) {
          const file = ticketFiles[i]
          const ticketId = transaction.ticketItems[i]?.id || `ticket-${i}`
          const url = await uploadTicketPdf(file, `tickets/${transaction.userId}/${transaction.id}/${ticketId}.pdf`)
          ticketPdfUrls.push(url)

          // Update progress
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
        }
      }

      // Approve transaction
      await approveTicketTransaction(transaction.id, user.id, adminNotes, downloadDate, ticketPdfUrls)

      onClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error approving transaction:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al aprobar la transacción.",
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
          <DialogTitle>Aprobar transacción</DialogTitle>
          <DialogDescription>Configura la fecha de descarga y sube los PDFs de los tickets</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Mostrar el comprobante de pago */}
          {transaction.paymentProofUrl && (
            <div className="space-y-2">
              <Label>Comprobante de pago</Label>
              <div className="relative h-[200px] border rounded-md overflow-hidden">
                <Image
                  src={transaction.paymentProofUrl || "/placeholder.svg"}
                  alt="Comprobante de pago"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => window.open(transaction.paymentProofUrl, "_blank")}>
                  Ver en tamaño completo
                </Button>
              </div>
            </div>
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
                  disabled={(date) => date < new Date()}
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
                onChange={handleFileChange}
                className="flex-1"
                multiple
                disabled={isSubmitting}
              />
              <Button variant="outline" size="icon" disabled={isSubmitting}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Puedes subir los archivos PDF ahora o más tarde desde la sección de gestión de tickets
            </p>

            {ticketFiles.length > 0 && (
              <div className="text-sm text-muted-foreground mt-1">{ticketFiles.length} archivo(s) seleccionado(s)</div>
            )}

            {isSubmitting && (
              <div className="mt-2">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-xs text-center mt-1">Subiendo archivos: {uploadProgress}%</p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-notes">Notas (opcional)</Label>
            <Textarea
              id="admin-notes"
              placeholder="Notas adicionales para el usuario..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Alert>
            <AlertTitle>Información importante</AlertTitle>
            <AlertDescription>
              Al aprobar esta transacción, se generarán los tickets para el usuario y se le notificará por correo
              electrónico. Asegúrate de que los archivos PDF subidos sean correctos y correspondan a las entradas
              compradas.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Aprobar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
