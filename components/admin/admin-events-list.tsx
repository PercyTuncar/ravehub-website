"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Search, Edit, Trash, Eye, AlertTriangle, Loader2 } from "lucide-react"
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
import { getEventsForAdmin, deleteEvent } from "@/lib/firebase/events"
import type { Event } from "@/types"
import { toast } from "@/components/ui/use-toast"

export function AdminEventsList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        const adminEvents = await getEventsForAdmin()
        setEvents(adminEvents)
      } catch (err) {
        console.error("Error fetching events:", err)
        setError("Ocurrió un error al cargar los eventos")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Filter events based on search term and status
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      (event.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (event.location?.city?.toLowerCase() || "").includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || event.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handle delete event
  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!eventToDelete) return

    try {
      setIsDeleting(true)
      await deleteEvent(eventToDelete.id)

      // Update events list
      setEvents(events.filter((e) => e.id !== eventToDelete.id))

      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el evento",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setEventToDelete(null)
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Publicado</Badge>
      case "draft":
        return <Badge variant="outline">Borrador</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      case "completed":
        return <Badge variant="secondary">Completado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de eventos</CardTitle>
        <Button asChild>
          <Link href="/admin/events/new" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Nuevo evento</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Entradas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Cargando eventos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-destructive">
                    <div className="flex justify-center items-center">
                      <AlertTriangle className="h-6 w-6 mr-2" />
                      <span>{error}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  // Calculate total capacity and sold tickets
                  const totalCapacity = event.zones?.reduce((sum, zone) => sum + (zone.capacity || 0), 0) || 0
                  const soldTickets =
                    event.salesPhases?.reduce(
                      (sum, phase) =>
                        sum + (phase.zonesPricing?.reduce((zoneSum, pricing) => zoneSum + (pricing.sold || 0), 0) || 0),
                      0,
                    ) || 0

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{new Date(event.startDate).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell>
                        {event.location.city}, {event.country}
                      </TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell>
                        {soldTickets} / {totalCapacity}
                        <div className="w-full h-2 bg-muted rounded-full mt-1">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(soldTickets / totalCapacity) * 100}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/eventos/${event.slug}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver</span>
                            </Link>
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/admin/events/${event.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Link>
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteClick(event)}>
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No se encontraron eventos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el evento "{eventToDelete?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
