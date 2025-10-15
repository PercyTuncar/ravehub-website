"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getAllDJSuggestions, approveDJSuggestion } from "@/lib/firebase/dj-suggestions"
import { getAllApprovedEventDJs, createEventDJ, updateEventDJ } from "@/lib/firebase/event-djs"
import type { DJSuggestion } from "@/types/dj-ranking"
import type { EventDJ } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Search, ThumbsUp, Edit, Eye, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AdminDJSuggestions() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<DJSuggestion[]>([])
  const [approvedDJs, setApprovedDJs] = useState<EventDJ[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<DJSuggestion[]>([])
  const [filteredDJs, setFilteredDJs] = useState<EventDJ[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [approvedFilter, setApprovedFilter] = useState("")
  const [selectedDJ, setSelectedDJ] = useState<EventDJ | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDJ, setEditingDJ] = useState<Partial<EventDJ>>({})

  // List of countries
  const countries = [
    { value: "all", label: "Todos los países" },
    { value: "peru", label: "Perú" },
    { value: "argentina", label: "Argentina" },
    { value: "chile", label: "Chile" },
    { value: "colombia", label: "Colombia" },
    { value: "mexico", label: "México" },
    { value: "spain", label: "España" },
    { value: "usa", label: "Estados Unidos" },
    // Add more countries as needed
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [allSuggestions, allApprovedDJs] = await Promise.all([
          getAllDJSuggestions(),
          getAllApprovedEventDJs()
        ])
        setSuggestions(allSuggestions)
        setApprovedDJs(allApprovedDJs)
        setFilteredSuggestions(allSuggestions)
        setFilteredDJs(allApprovedDJs)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  useEffect(() => {
    // Apply filters to suggestions
    let filtered = [...suggestions]

    if (searchTerm) {
      filtered = filtered.filter(
        (suggestion) =>
          suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          suggestion.instagram.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (countryFilter && countryFilter !== "all") {
      filtered = filtered.filter((suggestion) => suggestion.country === countryFilter)
    }

    if (approvedFilter === "approved") {
      filtered = filtered.filter((suggestion) => suggestion.approved)
    } else if (approvedFilter === "pending") {
      filtered = filtered.filter((suggestion) => !suggestion.approved)
    }

    setFilteredSuggestions(filtered)
  }, [suggestions, searchTerm, countryFilter, approvedFilter])

  useEffect(() => {
    // Apply filters to approved DJs
    let filtered = [...approvedDJs]

    if (searchTerm) {
      filtered = filtered.filter(
        (dj) =>
          dj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dj.instagramHandle?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (countryFilter && countryFilter !== "all") {
      filtered = filtered.filter((dj) => dj.country === countryFilter)
    }

    setFilteredDJs(filtered)
  }, [approvedDJs, searchTerm, countryFilter])

  const handleApproveSuggestion = async (suggestionId: string) => {
    if (!user) return

    try {
      await approveDJSuggestion(suggestionId, user.id)

      // Update local state
      setSuggestions(
        suggestions.map((suggestion) =>
          suggestion.id === suggestionId ? { ...suggestion, approved: true } : suggestion,
        ),
      )

      // Create the DJ profile in the eventDjs collection
      const suggestion = suggestions.find(s => s.id === suggestionId)
      if (suggestion) {
        const newDJ: Omit<EventDJ, "id" | "createdAt" | "updatedAt"> = {
          name: suggestion.name,
          imageUrl: "", // Will be added later by admin
          description: "",
          instagramHandle: suggestion.instagram,
          spotifyUrl: "",
          soundcloudUrl: "",
          genres: [],
          country: suggestion.country,
          bio: "",
          socialLinks: {},
          approved: true,
          createdBy: user.id,
        }

        const djId = await createEventDJ(newDJ)

        // Update the approved DJs list
        const createdDJ = await getAllApprovedEventDJs()
        setApprovedDJs(createdDJ)
      }

      toast({
        title: "Sugerencia aprobada",
        description: "El DJ ha sido aprobado y añadido a la base de datos de eventos.",
      })
    } catch (error) {
      console.error("Error approving DJ suggestion:", error)
      toast({
        title: "Error",
        description: "No se pudo aprobar la sugerencia.",
        variant: "destructive",
      })
    }
  }

  const handleEditDJ = (dj: EventDJ) => {
    setSelectedDJ(dj)
    setEditingDJ({ ...dj })
    setIsEditDialogOpen(true)
  }

  const handleSaveDJ = async () => {
    if (!selectedDJ) return

    try {
      await updateEventDJ(selectedDJ.id, editingDJ)

      // Update local state
      setApprovedDJs(
        approvedDJs.map((dj) =>
          dj.id === selectedDJ.id ? { ...dj, ...editingDJ } : dj,
        ),
      )

      toast({
        title: "DJ actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      })

      setIsEditDialogOpen(false)
      setSelectedDJ(null)
      setEditingDJ({})
    } catch (error) {
      console.error("Error updating DJ:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el DJ.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suggestions">Sugerencias Pendientes</TabsTrigger>
          <TabsTrigger value="approved">DJs Aprobados</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sugerencias de DJs</CardTitle>
              <CardDescription>Administra las sugerencias de DJs enviadas por los usuarios.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por nombre o Instagram..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={approvedFilter} onValueChange={setApprovedFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="approved">Aprobados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Instagram</TableHead>
                        <TableHead>País</TableHead>
                        <TableHead className="text-center">Popularidad</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map((suggestion) => (
                          <TableRow key={suggestion.id}>
                            <TableCell className="font-medium">{suggestion.name}</TableCell>
                            <TableCell>@{suggestion.instagram}</TableCell>
                            <TableCell>
                              {countries.find((c) => c.value === suggestion.country)?.label || suggestion.country}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="flex items-center justify-center">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                {suggestion.popularity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {suggestion.approved ? (
                                <Badge className="bg-green-500">Aprobado</Badge>
                              ) : (
                                <Badge variant="outline">Pendiente</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {!suggestion.approved && (
                                <Button size="sm" onClick={() => handleApproveSuggestion(suggestion.id)} className="ml-2">
                                  <Check className="h-4 w-4 mr-1" /> Aprobar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No se encontraron sugerencias.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>DJs Aprobados</CardTitle>
              <CardDescription>DJs disponibles para agregar a eventos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por nombre o Instagram..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Instagram</TableHead>
                        <TableHead>País</TableHead>
                        <TableHead>Géneros</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDJs.length > 0 ? (
                        filteredDJs.map((dj) => (
                          <TableRow key={dj.id}>
                            <TableCell className="font-medium">{dj.name}</TableCell>
                            <TableCell>@{dj.instagramHandle}</TableCell>
                            <TableCell>
                              {countries.find((c) => c.value === dj.country)?.label || dj.country}
                            </TableCell>
                            <TableCell>
                              {dj.genres && dj.genres.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {dj.genres.slice(0, 2).map((genre, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {genre}
                                    </Badge>
                                  ))}
                                  {dj.genres.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{dj.genres.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Sin géneros</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4 mr-1" /> Ver
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Perfil de {dj.name}</DialogTitle>
                                      <DialogDescription>
                                        Información completa del DJ
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="font-medium">Nombre</Label>
                                          <p>{dj.name}</p>
                                        </div>
                                        <div>
                                          <Label className="font-medium">Instagram</Label>
                                          <p>@{dj.instagramHandle}</p>
                                        </div>
                                        <div>
                                          <Label className="font-medium">País</Label>
                                          <p>{countries.find((c) => c.value === dj.country)?.label || dj.country}</p>
                                        </div>
                                        <div>
                                          <Label className="font-medium">Géneros</Label>
                                          <p>{dj.genres?.join(", ") || "No especificado"}</p>
                                        </div>
                                      </div>
                                      {dj.bio && (
                                        <div>
                                          <Label className="font-medium">Biografía</Label>
                                          <p className="text-sm text-muted-foreground mt-1">{dj.bio}</p>
                                        </div>
                                      )}
                                      {dj.description && (
                                        <div>
                                          <Label className="font-medium">Descripción</Label>
                                          <p className="text-sm text-muted-foreground mt-1">{dj.description}</p>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button size="sm" onClick={() => handleEditDJ(dj)}>
                                  <Edit className="h-4 w-4 mr-1" /> Editar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No se encontraron DJs aprobados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit DJ Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar DJ: {selectedDJ?.name}</DialogTitle>
            <DialogDescription>
              Actualiza la información del DJ para eventos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingDJ.name || ""}
                  onChange={(e) => setEditingDJ({ ...editingDJ, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-instagram">Instagram</Label>
                <Input
                  id="edit-instagram"
                  value={editingDJ.instagramHandle || ""}
                  onChange={(e) => setEditingDJ({ ...editingDJ, instagramHandle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-country">País</Label>
                <Select
                  value={editingDJ.country || ""}
                  onValueChange={(value) => setEditingDJ({ ...editingDJ, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.filter(c => c.value !== "all").map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-genres">Géneros (separados por coma)</Label>
                <Input
                  id="edit-genres"
                  value={editingDJ.genres?.join(", ") || ""}
                  onChange={(e) => setEditingDJ({
                    ...editingDJ,
                    genres: e.target.value.split(",").map(g => g.trim()).filter(g => g)
                  })}
                  placeholder="Techno, House, EDM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio">Biografía</Label>
              <Textarea
                id="edit-bio"
                value={editingDJ.bio || ""}
                onChange={(e) => setEditingDJ({ ...editingDJ, bio: e.target.value })}
                rows={3}
                placeholder="Breve biografía del DJ..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={editingDJ.description || ""}
                onChange={(e) => setEditingDJ({ ...editingDJ, description: e.target.value })}
                rows={3}
                placeholder="Descripción detallada para eventos..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-spotify">URL de Spotify</Label>
                <Input
                  id="edit-spotify"
                  value={editingDJ.spotifyUrl || ""}
                  onChange={(e) => setEditingDJ({ ...editingDJ, spotifyUrl: e.target.value })}
                  placeholder="https://open.spotify.com/artist/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-soundcloud">URL de SoundCloud</Label>
                <Input
                  id="edit-soundcloud"
                  value={editingDJ.soundcloudUrl || ""}
                  onChange={(e) => setEditingDJ({ ...editingDJ, soundcloudUrl: e.target.value })}
                  placeholder="https://soundcloud.com/..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDJ}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
