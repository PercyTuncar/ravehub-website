"use client"

import { useState, useEffect } from "react"
import { generateSlug } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getAllApprovedEventDJs, createEventDJ, updateEventDJ, getEventDJById, deleteEventDJ } from "@/lib/firebase/event-djs"
import { getAllCountries, searchCountries, createCountry } from "@/lib/firebase/countries"
import type { EventDJ } from "@/types"
import type { Country } from "@/lib/firebase/countries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Music, Search, Plus, Trash2, ExternalLink } from "lucide-react"
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CountryAutocomplete } from "@/components/ui/country-autocomplete"
import { SEOPreview } from "@/components/admin/seo-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Countries will be loaded from database

const genres = [
 // House y sus derivados
  "House",
  "Acid House",
  "Afro House",
  "Bass House",
  "Chicago House",
  "Deep House",
  "Electro House",
  "French House",
  "Future House",
  "G-House (Gangsta House)",
  "Melodic House",
  "Microhouse",
  "Progressive House",
  "Tech House",
  "Tropical House",

  // Techno y sus derivados
  "Techno",
  "Acid Techno",
  "Detroit Techno",
  "Dub Techno",
  "Hardgroove",
  "Industrial Techno",
  "Melodic Techno",
  "Minimal Techno",
  "Peak Time Techno",
  "Raw / Hypnotic Techno",

  // Trance y sus derivados
  "Trance",
  "Acid Trance",
  "Classic Trance",
  "Goa Trance",
  "Progressive Trance",
  "Psytrance (Psychedelic Trance)",
  "Tech Trance",
  "Uplifting Trance",
  "Vocal Trance",

  // Hard Dance
  "Hardstyle",
  "Hardcore",
  "Gabber",
  "Frenchcore",
  "Happy Hardcore",
  "Jumpstyle",
  "Rawstyle",
  "Uptempo Hardcore",

  // Drum & Bass / Jungle
  "Drum & Bass",
  "Jungle",
  "Breakcore",
  "Dancefloor D&B",
  "Jump-Up",
  "Liquid Drum & Bass",
  "Neurofunk",
  "Techstep",

  // Dubstep y Bass Music
  "Dubstep",
  "Brostep",
  "Chillstep",
  "Future Bass",
  "Grime",
  "Riddim",
  "Trap (EDM)",
  "Wave",

  // Downtempo y Ambient
  "Ambient",
  "Chillwave",
  "Downtempo",
  "Glitch",
  "IDM (Intelligent Dance Music)",
  "Lofi Hip Hop",
  "Trip Hop",
  "Psybient",

  // Breakbeat y relacionados
  "Breakbeat",
  "Big Beat",
  "Florida Breaks",
  "Nu Skool Breaks",

  // Géneros Retro / Synth
  "Synthwave",
  "Retrowave",
  "Vaporwave",
  "Darksynth",
  "Outrun",

  // Otros géneros y fusiones
  "Big Room House",
  "Disco / Nu-Disco",
  "EBM (Electronic Body Music)",
  "Electro",
  "Eurodance",
  "Hardbass",
  "Italo Disco",
  "Moombahton",
  "UK Garage / 2-Step",
  

  "Other",
  'EDM'
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  slug: z.string().min(1, {
    message: "El slug es requerido.",
  }).regex(/^[a-z0-9-]+$/, {
    message: "El slug solo puede contener letras minúsculas, números y guiones.",
  }),
  instagramHandle: z.string().min(1, {
    message: "El Instagram es requerido.",
  }),
  country: z.string({
    required_error: "Por favor selecciona un país.",
  }),
  bio: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  genres: z.array(z.string()).optional(),
  spotifyUrl: z.string().url().optional().or(z.literal("")),
  soundcloudUrl: z.string().url().optional().or(z.literal("")),
  performerType: z.enum(["Person", "MusicGroup"]),
  // Campos específicos para Person
  alternateName: z.string().optional(),
  birthDate: z.string().optional(),
  jobTitle: z.array(z.string()).optional(),
  // Campos específicos para MusicGroup
  foundingDate: z.string().optional(),
  members: z.array(z.object({
    name: z.string().min(1, "El nombre del miembro es requerido"),
    alternateName: z.string().optional(),
    role: z.string().optional(),
    sameAs: z.string().url().optional().or(z.literal("")),
  })).optional(),
  // Campos comunes para tracks y albums
  famousTracks: z.array(z.object({
    name: z.string().min(1, "El nombre del track es requerido"),
  })).optional(),
  famousAlbums: z.array(z.object({
    name: z.string().min(1, "El nombre del álbum es requerido"),
  })).optional(),
  // URLs adicionales para sameAs
  wikipediaUrl: z.string().url().optional().or(z.literal("")),
  officialWebsite: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
})

export function AdminEventArtists() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [artists, setArtists] = useState<EventDJ[]>([])
  const [filteredArtists, setFilteredArtists] = useState<EventDJ[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [countryFilter, setCountryFilter] = useState("all")
  const [selectedArtist, setSelectedArtist] = useState<EventDJ | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [artistToDelete, setArtistToDelete] = useState<EventDJ | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      instagramHandle: "",
      country: "",
      bio: "",
      imageUrl: "",
      description: "",
      genres: [],
      spotifyUrl: "",
      soundcloudUrl: "",
      performerType: "Person",
      alternateName: "",
      birthDate: "",
      jobTitle: [],
      foundingDate: "",
      members: [],
      famousTracks: [],
      famousAlbums: [],
      wikipediaUrl: "",
      officialWebsite: "",
      facebookUrl: "",
      twitterUrl: "",
    },
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [allArtists, allCountries] = await Promise.all([
          getAllApprovedEventDJs(),
          getAllCountries()
        ])
        setArtists(allArtists)
        setFilteredArtists(allArtists)
        setCountries(allCountries)
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
    // Apply filters
    let filtered = [...artists]

    if (searchTerm) {
      filtered = filtered.filter(
        (artist) =>
          artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          artist.instagramHandle?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (countryFilter && countryFilter !== "all") {
      filtered = filtered.filter((artist) => artist.country === countryFilter)
    }

    setFilteredArtists(filtered)
  }, [artists, searchTerm, countryFilter])

  const handleCreateArtist = () => {
    setSelectedArtist(null)
    setSelectedCountry(null)
    setIsCreateMode(true)
    form.reset({
      name: "",
      slug: "",
      instagramHandle: "",
      country: "",
      bio: "",
      imageUrl: "",
      description: "",
      genres: [],
      spotifyUrl: "",
      soundcloudUrl: "",
      performerType: "Person",
      alternateName: "",
      birthDate: "",
      jobTitle: [],
      foundingDate: "",
      members: [],
      famousTracks: [],
      famousAlbums: [],
      wikipediaUrl: "",
      officialWebsite: "",
      facebookUrl: "",
      twitterUrl: "",
    })
    setIsDialogOpen(true)
  }

  // Auto-generate slug when name changes
  useEffect(() => {
    const nameValue = form.watch("name")
    const currentSlug = form.watch("slug")

    if (nameValue && !currentSlug) {
      const generatedSlug = generateSlug(nameValue)
      form.setValue("slug", generatedSlug)
    }
  }, [form.watch("name")])

  const handleEditArtist = async (artistId: string) => {
    const artist = await getEventDJById(artistId)
    if (artist) {
      setSelectedArtist(artist)
      setSelectedCountry(countries.find(c => c.name === artist.country) || null)
      setIsCreateMode(false)
      form.reset({
        name: artist.name,
        slug: (artist as any).slug || "",
        instagramHandle: artist.instagramHandle || "",
        country: artist.country || "",
        bio: artist.bio || "",
        imageUrl: artist.imageUrl || "",
        description: artist.description || "",
        genres: artist.genres || [],
        spotifyUrl: artist.spotifyUrl || "",
        soundcloudUrl: artist.soundcloudUrl || "",
        performerType: (artist as any).performerType || "Person",
        alternateName: (artist as any).alternateName || "",
        birthDate: (artist as any).birthDate || "",
        jobTitle: (artist as any).jobTitle || [],
        foundingDate: (artist as any).foundingDate || "",
        members: (artist as any).members || [],
        famousTracks: (artist as any).famousTracks || [],
        famousAlbums: (artist as any).famousAlbums || [],
        wikipediaUrl: (artist as any).socialLinks?.wikipedia || "",
        officialWebsite: (artist as any).socialLinks?.website || "",
        facebookUrl: (artist as any).socialLinks?.facebook || "",
        twitterUrl: (artist as any).socialLinks?.twitter || "",
      })
      setIsDialogOpen(true)
    } else {
      toast({
        title: "Error",
        description: "No se pudo cargar el artista.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteArtist = async (artist: EventDJ) => {
    try {
      await deleteEventDJ(artist.id)

      // Update local state
      setArtists(artists.filter((a) => a.id !== artist.id))
      setFilteredArtists(filteredArtists.filter((a) => a.id !== artist.id))

      toast({
        title: "Artista eliminado",
        description: `El artista "${artist.name}" ha sido eliminado exitosamente.`,
      })
    } catch (error) {
      console.error("Error deleting artist:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el artista.",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return

    // Check for duplicate slug
    if (isCreateMode || (selectedArtist && values.slug !== selectedArtist.slug)) {
      const existingArtist = artists.find(artist => artist.slug === values.slug)
      if (existingArtist) {
        form.setError("slug", {
          type: "manual",
          message: "Este slug ya está en uso. Por favor elige uno diferente."
        })
        return
      }
    }

    try {
      if (isCreateMode) {
        // Create new artist
        const newArtist: Omit<EventDJ, "id" | "createdAt" | "updatedAt"> = {
          name: values.name,
          slug: values.slug,
          imageUrl: values.imageUrl || "",
          description: values.description || "",
          instagramHandle: values.instagramHandle,
          spotifyUrl: values.spotifyUrl || "",
          soundcloudUrl: values.soundcloudUrl || "",
          genres: values.genres || [],
          country: values.country,
          bio: values.bio || "",
          socialLinks: {
            spotify: values.spotifyUrl || "",
            soundcloud: values.soundcloudUrl || "",
            website: values.officialWebsite || "",
            facebook: values.facebookUrl || "",
            twitter: values.twitterUrl || "",
          },
          approved: true,
          createdBy: user.id,
          // Schema.org fields (stored as any for now)
          ...(values.performerType && { performerType: values.performerType }),
          ...(values.alternateName && { alternateName: values.alternateName }),
          ...(values.birthDate && { birthDate: values.birthDate }),
          ...(values.jobTitle && values.jobTitle.length > 0 && { jobTitle: values.jobTitle }),
          ...(values.foundingDate && { foundingDate: values.foundingDate }),
          ...(values.members && values.members.length > 0 && { members: values.members }),
          ...(values.famousTracks && values.famousTracks.length > 0 && { famousTracks: values.famousTracks }),
          ...(values.famousAlbums && values.famousAlbums.length > 0 && { famousAlbums: values.famousAlbums }),
        }

        const artistId = await createEventDJ(newArtist)

        // Update local state
        const createdArtist = await getEventDJById(artistId)
        if (createdArtist) {
          setArtists([...artists, createdArtist])
        }

        toast({
          title: "Artista creado",
          description: "El artista ha sido creado exitosamente.",
        })
      } else if (selectedArtist) {
        // Update existing artist
        const updatedData = {
          name: values.name,
          slug: values.slug,
          imageUrl: values.imageUrl || "",
          description: values.description || "",
          instagramHandle: values.instagramHandle,
          spotifyUrl: values.spotifyUrl || "",
          soundcloudUrl: values.soundcloudUrl || "",
          genres: values.genres || [],
          country: values.country,
          bio: values.bio || "",
          socialLinks: {
            spotify: values.spotifyUrl || "",
            soundcloud: values.soundcloudUrl || "",
            website: values.officialWebsite || "",
            facebook: values.facebookUrl || "",
            twitter: values.twitterUrl || "",
            wikipedia: values.wikipediaUrl || "",
          },
          // Schema.org fields
          ...(values.performerType && { performerType: values.performerType }),
          ...(values.alternateName && { alternateName: values.alternateName }),
          ...(values.birthDate && { birthDate: values.birthDate }),
          ...(values.jobTitle && values.jobTitle.length > 0 && { jobTitle: values.jobTitle }),
          ...(values.foundingDate && { foundingDate: values.foundingDate }),
          ...(values.members && values.members.length > 0 && { members: values.members }),
          ...(values.famousTracks && values.famousTracks.length > 0 && { famousTracks: values.famousTracks }),
          ...(values.famousAlbums && values.famousAlbums.length > 0 && { famousAlbums: values.famousAlbums }),
        }

        await updateEventDJ(selectedArtist.id, updatedData)

        // Update local state
        setArtists(artists.map((artist) =>
          artist.id === selectedArtist.id ? { ...artist, ...updatedData } : artist
        ))

        toast({
          title: "Artista actualizado",
          description: "Los cambios han sido guardados exitosamente.",
        })
      }

      setIsDialogOpen(false)
      setSelectedArtist(null)
      setIsCreateMode(false)
    } catch (error) {
      console.error("Error saving artist:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el artista.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Artistas de Eventos</CardTitle>
            <CardDescription>Administra los artistas disponibles para agregar a eventos.</CardDescription>
          </div>
          <Button onClick={handleCreateArtist}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Artista
          </Button>
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
                  <SelectItem key={country.id} value={country.name}>
                    {country.flag} {country.name}
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
                    <TableHead>Artista</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Géneros</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArtists.length > 0 ? (
                    filteredArtists.map((artist) => (
                      <TableRow key={artist.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              {artist.imageUrl ? (
                                <AvatarImage src={artist.imageUrl || "/placeholder.svg"} alt={artist.name} />
                              ) : (
                                <AvatarFallback>
                                  <Music className="h-5 w-5" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="font-medium">{artist.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>@{artist.instagramHandle}</TableCell>
                        <TableCell>
                          {countries.find((c) => c.name === artist.country)?.flag} {countries.find((c) => c.name === artist.country)?.name || artist.country}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(artist as any).performerType || "Person"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {artist.genres && artist.genres.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {artist.genres.slice(0, 2).map((genre, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                              {artist.genres.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{artist.genres.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin géneros</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(artist as any).slug && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/${(artist as any).slug}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" /> Ver
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleEditArtist(artist.id)}>
                              <Edit className="h-4 w-4 mr-1" /> Editar
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al artista
                                    "{artist.name}" y lo removerá de todos los eventos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteArtist(artist)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No se encontraron artistas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Artist Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreateMode ? "Crear Nuevo Artista" : "Editar Artista"}</DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? "Agrega un nuevo artista a la base de datos de eventos."
                : "Actualiza la información del artista."
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                  <TabsTrigger value="seo">SEO Preview</TabsTrigger>
                </TabsList>
               <TabsContent value="basic" className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                     control={form.control}
                     name="name"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Nombre *</FormLabel>
                         <FormControl>
                           <Input {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="slug"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Slug (URL) *</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="martin-garrix" />
                         </FormControl>
                         <FormDescription>
                           URL amigable generada automáticamente. Solo letras minúsculas, números y guiones.
                         </FormDescription>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="instagramHandle"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Instagram *</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="@artistaoficial" />
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
                         <FormLabel>País *</FormLabel>
                         <FormControl>
                           <CountryAutocomplete
                             value={field.value}
                             onChange={field.onChange}
                             onCountrySelect={(country) => {
                               field.onChange(country.name)
                               setSelectedCountry(country)
                             }}
                             placeholder="Buscar o crear país..."
                           />
                         </FormControl>
                         <FormDescription>
                           Busca un país existente o crea uno nuevo si no está en la lista
                         </FormDescription>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="performerType"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Tipo de Artista *</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder="Selecciona tipo" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             <SelectItem value="Person">Artista Individual (Person)</SelectItem>
                             <SelectItem value="MusicGroup">Grupo Musical (MusicGroup)</SelectItem>
                           </SelectContent>
                         </Select>
                         <FormDescription>
                           Selecciona si es un artista solista o un grupo musical. Esto determina el Schema.org generado.
                         </FormDescription>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="imageUrl"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>URL de Imagen</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="https://ejemplo.com/imagen.jpg" />
                         </FormControl>
                         <FormDescription>URL de la foto de perfil del artista</FormDescription>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="spotifyUrl"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>URL de Spotify</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="https://open.spotify.com/artist/..." />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="soundcloudUrl"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>URL de SoundCloud</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="https://soundcloud.com/..." />
                         </FormControl>
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
                           placeholder="Breve biografía del artista..."
                           className="min-h-[80px]"
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={form.control}
                   name="description"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Descripción para Eventos</FormLabel>
                       <FormControl>
                         <Textarea
                           {...field}
                           placeholder="Descripción detallada que aparecerá en los eventos..."
                           className="min-h-[80px]"
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
                       <FormLabel>Géneros Musicales</FormLabel>
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
                       <FormDescription>Selecciona los géneros musicales que toca el artista</FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </TabsContent>

               <TabsContent value="advanced" className="space-y-6">
                 {/* Campos dinámicos según el tipo de artista */}
                 {form.watch("performerType") === "Person" && (
                   <div className="space-y-4 border rounded-md p-4 bg-blue-50 dark:bg-blue-950/20">
                     <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">Campos Específicos para Artista Individual (Person)</h3>

                     <FormField
                       control={form.control}
                       name="alternateName"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Nombre Real (alternateName)</FormLabel>
                           <FormControl>
                             <Input {...field} placeholder="Martijn Gerard Garritsen" />
                           </FormControl>
                           <FormDescription>Nombre real completo del artista (opcional)</FormDescription>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     <FormField
                       control={form.control}
                       name="birthDate"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Fecha de Nacimiento (birthDate)</FormLabel>
                           <FormControl>
                             <Input {...field} type="date" />
                           </FormControl>
                           <FormDescription>Fecha de nacimiento en formato YYYY-MM-DD</FormDescription>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     <FormField
                       control={form.control}
                       name="jobTitle"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Títulos Profesionales (jobTitle)</FormLabel>
                           <div className="flex flex-wrap gap-2">
                             {["DJ", "Productor Musical", "Compositor", "Cantante", "Remixer"].map((title) => (
                               <Badge
                                 key={title}
                                 variant={field.value?.includes(title) ? "default" : "outline"}
                                 className="cursor-pointer"
                                 onClick={() => {
                                   const currentTitles = field.value || []
                                   if (currentTitles.includes(title)) {
                                     field.onChange(currentTitles.filter((t) => t !== title))
                                   } else {
                                     field.onChange([...currentTitles, title])
                                   }
                                 }}
                               >
                                 {title}
                               </Badge>
                             ))}
                           </div>
                           <FormDescription>Selecciona los títulos profesionales del artista</FormDescription>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </div>
                 )}

                 {form.watch("performerType") === "MusicGroup" && (
                   <div className="space-y-4 border rounded-md p-4 bg-green-50 dark:bg-green-950/20">
                     <h3 className="text-lg font-medium text-green-900 dark:text-green-100">Campos Específicos para Grupo Musical (MusicGroup)</h3>

                     <FormField
                       control={form.control}
                       name="foundingDate"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Fecha de Fundación (foundingDate)</FormLabel>
                           <FormControl>
                             <Input {...field} placeholder="2008" />
                           </FormControl>
                           <FormDescription>Año de fundación del grupo</FormDescription>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     <FormField
                       control={form.control}
                       name="members"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Miembros del Grupo (member)</FormLabel>
                           <FormControl>
                             <div className="space-y-2">
                               {field.value?.map((member, index) => (
                                 <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                   <Input
                                     placeholder="Nombre del miembro"
                                     value={member.name}
                                     onChange={(e) => {
                                       const newMembers = [...(field.value || [])]
                                       newMembers[index].name = e.target.value
                                       field.onChange(newMembers)
                                     }}
                                   />
                                   <Input
                                     placeholder="Rol (opcional)"
                                     value={member.role || ""}
                                     onChange={(e) => {
                                       const newMembers = [...(field.value || [])]
                                       newMembers[index].role = e.target.value
                                       field.onChange(newMembers)
                                     }}
                                   />
                                   <Input
                                     placeholder="URL perfil (opcional)"
                                     value={member.sameAs || ""}
                                     onChange={(e) => {
                                       const newMembers = [...(field.value || [])]
                                       newMembers[index].sameAs = e.target.value
                                       field.onChange(newMembers)
                                     }}
                                   />
                                   <Button
                                     type="button"
                                     variant="destructive"
                                     size="sm"
                                     onClick={() => {
                                       const newMembers = field.value?.filter((_, i) => i !== index) || []
                                       field.onChange(newMembers)
                                     }}
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </div>
                               ))}
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                   const newMembers = [...(field.value || []), { name: "", role: "", sameAs: "" }]
                                   field.onChange(newMembers)
                                 }}
                               >
                                 <Plus className="h-4 w-4 mr-2" />
                                 Agregar Miembro
                               </Button>
                             </div>
                           </FormControl>
                           <FormDescription>Agrega los miembros del grupo musical</FormDescription>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </div>
                 )}

                 {/* Campos comunes para tracks y albums */}
                 <div className="space-y-4 border rounded-md p-4 bg-purple-50 dark:bg-purple-950/20">
                   <h3 className="text-lg font-medium text-purple-900 dark:text-purple-100">Obras Famosas</h3>

                   <FormField
                     control={form.control}
                     name="famousTracks"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Tracks Famosos (track)</FormLabel>
                         <FormControl>
                           <div className="space-y-2">
                             {field.value?.map((track, index) => (
                               <div key={index} className="flex items-center gap-2">
                                 <Input
                                   placeholder="Nombre del track"
                                   value={track.name}
                                   onChange={(e) => {
                                     const newTracks = [...(field.value || [])]
                                     newTracks[index].name = e.target.value
                                     field.onChange(newTracks)
                                   }}
                                 />
                                 <Button
                                   type="button"
                                   variant="destructive"
                                   size="sm"
                                   onClick={() => {
                                     const newTracks = field.value?.filter((_, i) => i !== index) || []
                                     field.onChange(newTracks)
                                   }}
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </div>
                             ))}
                             <Button
                               type="button"
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 const newTracks = [...(field.value || []), { name: "" }]
                                 field.onChange(newTracks)
                               }}
                             >
                               <Plus className="h-4 w-4 mr-2" />
                               Agregar Track
                             </Button>
                           </div>
                         </FormControl>
                         <FormDescription>Tracks más famosos del artista</FormDescription>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="famousAlbums"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Álbumes Famosos (album)</FormLabel>
                         <FormControl>
                           <div className="space-y-2">
                             {field.value?.map((album, index) => (
                               <div key={index} className="flex items-center gap-2">
                                 <Input
                                   placeholder="Nombre del álbum"
                                   value={album.name}
                                   onChange={(e) => {
                                     const newAlbums = [...(field.value || [])]
                                     newAlbums[index].name = e.target.value
                                     field.onChange(newAlbums)
                                   }}
                                 />
                                 <Button
                                   type="button"
                                   variant="destructive"
                                   size="sm"
                                   onClick={() => {
                                     const newAlbums = field.value?.filter((_, i) => i !== index) || []
                                     field.onChange(newAlbums)
                                   }}
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </div>
                             ))}
                             <Button
                               type="button"
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 const newAlbums = [...(field.value || []), { name: "" }]
                                 field.onChange(newAlbums)
                               }}
                             >
                               <Plus className="h-4 w-4 mr-2" />
                               Agregar Álbum
                             </Button>
                           </div>
                         </FormControl>
                         <FormDescription>Álbumes más famosos del artista</FormDescription>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>

                 {/* URLs adicionales para sameAs */}
                 <div className="space-y-4 border rounded-md p-4 bg-orange-50 dark:bg-orange-950/20">
                   <h3 className="text-lg font-medium text-orange-900 dark:text-orange-100">URLs para Schema.org (sameAs)</h3>

                   <FormField
                     control={form.control}
                     name="wikipediaUrl"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Wikipedia</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="https://es.wikipedia.org/wiki/..." />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="officialWebsite"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Sitio Web Oficial</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="https://artista.com" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="facebookUrl"
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
                     name="twitterUrl"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Twitter/X</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="https://twitter.com/..." />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>

                 {/* Schema.org Preview Section */}
                 <div className="mt-6 p-4 border rounded-md bg-muted/50">
                   <h4 className="font-medium mb-3">Vista Previa Schema.org</h4>
                   <div className="space-y-2">
                     <div>
                       <p className="text-sm font-medium text-muted-foreground">Tipo de Schema:</p>
                       <p className="text-blue-600 text-sm">
                         {form.watch("performerType") === "Person" ? "Person (Artista Individual)" : "MusicGroup (Grupo Musical)"}
                       </p>
                     </div>
                     <div>
                       <p className="text-sm font-medium text-muted-foreground">Nombre:</p>
                       <p className="text-sm">{form.watch("name") || "[Nombre del artista]"}</p>
                     </div>
                     <div>
                       <p className="text-sm font-medium text-muted-foreground">URLs sameAs:</p>
                       <div className="text-xs space-y-1">
                         {form.watch("spotifyUrl") && <p>🎵 Spotify: {form.watch("spotifyUrl")}</p>}
                         {form.watch("soundcloudUrl") && <p>🎵 SoundCloud: {form.watch("soundcloudUrl")}</p>}
                         {form.watch("officialWebsite") && <p>🌐 Website: {form.watch("officialWebsite")}</p>}
                         {form.watch("facebookUrl") && <p>📘 Facebook: {form.watch("facebookUrl")}</p>}
                         {form.watch("twitterUrl") && <p>🐦 Twitter: {form.watch("twitterUrl")}</p>}
                         {form.watch("wikipediaUrl") && <p>📖 Wikipedia: {form.watch("wikipediaUrl")}</p>}
                       </div>
                     </div>
                   </div>
                   <p className="text-xs text-muted-foreground mt-3">
                     El Schema.org completo se generará automáticamente cuando guardes el artista.
                   </p>
                 </div>
               </TabsContent>

               <TabsContent value="seo" className="space-y-6">
                 <SEOPreview
                   title={form.watch("name") || "Nombre del artista"}
                   description={form.watch("bio") || form.watch("description") || "Descripción del artista"}
                   url={`https://www.ravehublatam.com/${form.watch("slug") || 'artista'}`}
                   imageUrl={form.watch("imageUrl")}
                 />
               </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {isCreateMode ? "Crear Artista" : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}