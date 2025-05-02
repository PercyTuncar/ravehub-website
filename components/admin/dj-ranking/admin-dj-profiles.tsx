"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getAllDJs, getDJById, updateDJProfile } from "@/lib/firebase/djs"
import type { DJ } from "@/types/dj-ranking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Music, Search, ThumbsUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/context/auth-context"
import { Textarea } from "@/components/ui/textarea"
import { approveDJSuggestion } from "@/lib/firebase/admin"

// List of countries
const countries = [
  { value: "peru", label: "Perú" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "colombia", label: "Colombia" },
  { value: "mexico", label: "México" },
  { value: "spain", label: "España" },
  { value: "usa", label: "Estados Unidos" },
  // Add more countries as needed
]

const genres = [
  "House",
  "Techno",
  "Trance",
  "Hardstyle",
  "Drum & Bass",
  "Dubstep",
  "Hip Hop",
  "R&B",
  "Pop",
  "Rock",
  "Indie",
  "Electronic",
  "Latin",
  "Reggaeton",
  "Salsa",
  "Cumbia",
  "Merengue",
  "Bachata",
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  instagram: z.string().min(1, {
    message: "El Instagram es requerido.",
  }),
  country: z.string({
    required_error: "Por favor selecciona un país.",
  }),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  genres: z.array(z.string()).optional(),
  socialLinks: z
    .object({
      facebook: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      soundcloud: z.string().url().optional().or(z.literal("")),
      spotify: z.string().url().optional().or(z.literal("")),
      website: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
})

export function AdminDJProfiles() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [djs, setDjs] = useState<DJ[]>([])
  const [filteredDjs, setFilteredDjs] = useState<DJ[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [selectedDJ, setSelectedDJ] = useState<DJ | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      instagram: "",
      country: "",
      bio: "",
      photoUrl: "",
      genres: [],
      socialLinks: {
        facebook: "",
        twitter: "",
        soundcloud: "",
        spotify: "",
        website: "",
      },
    },
  })

  useEffect(() => {
    const loadDJs = async () => {
      setIsLoading(true)
      try {
        const allDJs = await getAllDJs()
        setDjs(allDJs)
        setFilteredDjs(allDJs)
      } catch (error) {
        console.error("Error loading DJs:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los DJs.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDJs()
  }, [toast])

  useEffect(() => {
    // Apply filters
    let filtered = [...djs]

    if (searchTerm) {
      filtered = filtered.filter(
        (dj) =>
          dj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dj.instagram.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (countryFilter) {
      filtered = filtered.filter((dj) => dj.country === countryFilter)
    }

    setFilteredDjs(filtered)
  }, [djs, searchTerm, countryFilter])

  const handleApproveSuggestion = async (djId: string) => {
    if (!user) return

    try {
      await approveDJSuggestion(djId, user.id)

      // Update local state
      setDjs(djs.map((dj) => (dj.id === djId ? { ...dj, approved: true } : dj)))

      toast({
        title: "Sugerencia aprobada",
        description: "El DJ ha sido aprobado y añadido a la base de datos.",
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

  const handleEditDJ = async (djId: string) => {
    const dj = await getDJById(djId)
    if (dj) {
      setSelectedDJ(dj)
      form.reset(dj)
      setIsDialogOpen(true)
    } else {
      toast({
        title: "Error",
        description: "No se pudo cargar el DJ.",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedDJ) return

    try {
      await updateDJProfile(selectedDJ.id, values)
      setDjs(djs.map((dj) => (dj.id === selectedDJ.id ? { ...dj, ...values } : dj)))
      setFilteredDjs(filteredDjs.map((dj) => (dj.id === selectedDJ.id ? { ...dj, ...values } : dj)))
      toast({
        title: "Perfil actualizado",
        description: "El perfil del DJ ha sido actualizado correctamente.",
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error updating DJ profile:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil del DJ.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfiles de DJs</CardTitle>
          <CardDescription>Administra y completa los perfiles de los DJs aprobados.</CardDescription>
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
                <SelectItem value="all">Todos los países</SelectItem>
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
                    <TableHead>DJ</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead className="text-center">Popularidad</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDjs.length > 0 ? (
                    filteredDjs.map((dj) => {
                      const isProfileComplete = !!(dj.bio && dj.photoUrl && dj.genres && dj.genres.length > 0)

                      return (
                        <TableRow key={dj.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                {dj.photoUrl ? (
                                  <AvatarImage src={dj.photoUrl || "/placeholder.svg"} alt={dj.name} />
                                ) : (
                                  <AvatarFallback>
                                    <Music className="h-5 w-5" />
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="font-medium">{dj.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>@{dj.instagram}</TableCell>
                          <TableCell>{countries.find((c) => c.value === dj.country)?.label || dj.country}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="flex items-center justify-center">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {dj.popularity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {dj.approved ? (
                              <Badge className="bg-green-500">Aprobado</Badge>
                            ) : (
                              <Badge variant="outline">Pendiente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => handleEditDJ(dj.id)}>
                              <Edit className="h-4 w-4 mr-1" /> Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No se encontraron DJs.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar perfil de DJ</DialogTitle>
            <DialogDescription>Completa la información del perfil del DJ.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de foto</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormDescription>URL de la foto de perfil del DJ</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Escribe una breve biografía del DJ..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Géneros musicales</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <Badge
                          key={genre}
                          variant={field.value?.includes(genre) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const currentGenres = field.value || []
                            if (currentGenres.includes(genre)) {
                              field.onChange(currentGenres.filter((g) => g !== genre))
                            } else {
                              field.onChange([...currentGenres, genre])
                            }
                          }}
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                    <FormDescription>Selecciona los géneros musicales que toca el DJ</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Redes sociales</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="socialLinks.facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://facebook.com/..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialLinks.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://twitter.com/..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialLinks.soundcloud"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SoundCloud</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://soundcloud.com/..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialLinks.spotify"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spotify</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://open.spotify.com/..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialLinks.website"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Sitio web</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Guardar cambios</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
