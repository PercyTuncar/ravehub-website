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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { nominateTicket } from "@/lib/firebase/tickets"
import { toast } from "@/components/ui/use-toast"

interface NominateTicketModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  transactionId?: string
  onSuccess?: () => void
}

export function NominateTicketModal({ isOpen, onClose, ticketId, transactionId, onSuccess }: NominateTicketModalProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [docType, setDocType] = useState("dni")
  const [docNumber, setDocNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Validar campos
    if (!firstName.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (!lastName.trim()) {
      toast({
        title: "Error",
        description: "El apellido es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (!docNumber.trim()) {
      toast({
        title: "Error",
        description: "El número de documento es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Verificar que tenemos el ID de la transacción
      if (!transactionId) {
        throw new Error("No se proporcionó el ID de la transacción")
      }

      console.log(`Nominando ticket ${ticketId} en la transacción ${transactionId}...`)

      // Nominar el ticket
      await nominateTicket(ticketId, firstName, lastName, docType, docNumber, transactionId)

      toast({
        title: "Ticket nominado",
        description: "El ticket ha sido nominado exitosamente",
      })

      // Cerrar modal y ejecutar callback de éxito
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error nominating ticket:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al nominar el ticket",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nominar ticket</DialogTitle>
          <DialogDescription>Ingresa los datos de la persona que asistirá al evento con este ticket.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nombre"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellido"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="docType">Tipo de documento</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger id="docType">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="passport">Pasaporte</SelectItem>
                  <SelectItem value="ce">Carnet de Extranjería</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="docNumber">Número de documento</Label>
              <Input
                id="docNumber"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Número"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Nominar ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
