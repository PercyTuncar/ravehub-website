"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { getAllCTAs, updateCTA, deleteCTA } from "@/lib/firebase/ctas"
import { getEventById } from "@/lib/firebase/events"
import { useAuth } from "@/context/auth-context"
import { toast } from "@/components/ui/use-toast"
import type { EventCTA, Event } from "@/types"
import { Edit, Trash2, Plus, ExternalLink } from "lucide-react"

export function AdminCTAsList() {
  const [ctas, setCTAs] = useState<EventCTA[]>([])
  const [events, setEvents] = useState<Record<string, Event>>({})
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ctaToDelete, setCTAToDelete] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchCTAs = async () => {
      try {
        setLoading(true)
        const ctasData = await getAllCTAs()
        setCTAs(ctasData)

        // Fetch event details for each CTA
        const eventsData: Record<string, Event> = {}
        for (const cta of ctasData) {
          if (!eventsData[cta.eventId]) {
            const event = await getEventById(cta.eventId)
            if (event) {
              eventsData[cta.eventId] = event
            }
          }
        }
        setEvents(eventsData)
      } catch (error) {
        console.error("Error fetching CTAs:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los CTAs",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCTAs()
  }, [])

  const handleToggleActive = async (cta: EventCTA) => {
    try {
      await updateCTA(cta.id, {
        isActive: !cta.isActive,
        updatedBy: user?.id || "",
      })

      setCTAs((prevCTAs) => prevCTAs.map((c) => (c.id === cta.id ? { ...c, isActive: !c.isActive } : c)))

      toast({
        title: "CTA actualizado",
        description: `El CTA ha sido ${!cta.isActive ? "activado" : "desactivado"} correctamente`,
      })
    } catch (error) {
      console.error("Error toggling CTA active state:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del CTA",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    setCTAToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!ctaToDelete) return

    try {
      await deleteCTA(ctaToDelete)
      setCTAs((prevCTAs) => prevCTAs.filter((cta) => cta.id !== ctaToDelete))
      toast({
        title: "CTA eliminado",
        description: "El CTA ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting CTA:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el CTA",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCTAToDelete(null)
    }
  }

  const isCountdownActive = (cta: EventCTA): boolean => {
    if (!cta.hasCountdown || !cta.countdownEndDate) return false
    return new Date(cta.countdownEndDate) > new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Call to Actions</h2>
        <Button asChild>
          <Link href="/admin/ctas/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo CTA
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : ctas.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">No hay CTAs creados todavía</p>
          <Button asChild>
            <Link href="/admin/ctas/new">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer CTA
            </Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Tipo de contacto</TableHead>
                <TableHead>Countdown</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ctas.map((cta) => (
                <TableRow key={cta.id}>
                  <TableCell className="font-medium">{cta.title}</TableCell>
                  <TableCell>
                    {events[cta.eventId] ? (
                      <Link
                        href={`/eventos/${events[cta.eventId].slug}`}
                        target="_blank"
                        className="flex items-center hover:text-primary"
                      >
                        {events[cta.eventId].name}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Evento no encontrado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cta.contactType === "whatsapp" ? "default" : "secondary"}>
                      {cta.contactType === "whatsapp" ? "WhatsApp" : "Link externo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cta.hasCountdown ? (
                      <Badge variant={isCountdownActive(cta) ? "outline" : "destructive"}>
                        {isCountdownActive(cta) ? "Activo" : "Finalizado"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No tiene</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch checked={cta.isActive} onCheckedChange={() => handleToggleActive(cta)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => router.push(`/admin/ctas/${cta.id}/edit`)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(cta.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El CTA será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
