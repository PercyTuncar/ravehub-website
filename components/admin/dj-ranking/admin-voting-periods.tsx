"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  getActiveVotingPeriods,
  createOrUpdateVotingPeriod,
  generateRanking,
  publishRanking,
} from "@/lib/firebase/voting"
import type { VotingPeriod } from "@/types/dj-ranking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Edit, Plus, Trophy } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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

const formSchema = z.object({
  country: z.string({
    required_error: "Por favor selecciona un país.",
  }),
  year: z.number({
    required_error: "Por favor selecciona un año.",
  }),
  suggestionsOpen: z.boolean(),
  votingOpen: z.boolean(),
  resultsPublished: z.boolean(),
  topCount: z.number().min(5).max(100),
})

export function AdminVotingPeriods() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [votingPeriods, setVotingPeriods] = useState<VotingPeriod[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<VotingPeriod | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country: "",
      year: new Date().getFullYear(),
      suggestionsOpen: true,
      votingOpen: false,
      resultsPublished: false,
      topCount: 100,
    },
  })

  useEffect(() => {
    const loadVotingPeriods = async () => {
      setIsLoading(true)
      try {
        // Get all voting periods
        const periodsRef = await getActiveVotingPeriods()
        setVotingPeriods(periodsRef)
      } catch (error) {
        console.error("Error loading voting periods:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los periodos de votación.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadVotingPeriods()
  }, [toast])

  const handleCreatePeriod = () => {
    setSelectedPeriod(null)
    setIsCreating(true)
    form.reset({
      country: "",
      year: new Date().getFullYear(),
      suggestionsOpen: true,
      votingOpen: false,
      resultsPublished: false,
      topCount: 100,
    })
    setIsDialogOpen(true)
  }

  const handleEditPeriod = async (periodId: string) => {
    const period = votingPeriods.find((p) => p.id === periodId)
    if (period) {
      setSelectedPeriod(period)
      setIsCreating(false)
      form.reset({
        country: period.country,
        year: period.year,
        suggestionsOpen: period.suggestionsOpen,
        votingOpen: period.votingOpen,
        resultsPublished: period.resultsPublished,
        topCount: period.topCount,
      })
      setIsDialogOpen(true)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createOrUpdateVotingPeriod(values)

      // Refresh the list
      const periodsRef = await getActiveVotingPeriods()
      setVotingPeriods(periodsRef)

      toast({
        title: isCreating ? "Periodo creado" : "Periodo actualizado",
        description: isCreating
          ? "El periodo de votación ha sido creado exitosamente."
          : "El periodo de votación ha sido actualizado exitosamente.",
      })

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving voting period:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el periodo de votación.",
        variant: "destructive",
      })
    }
  }

  const handleGenerateRanking = async (country: string, year: number) => {
    try {
      await generateRanking(country, year)

      // Refresh the list
      const periodsRef = await getActiveVotingPeriods()
      setVotingPeriods(periodsRef)

      toast({
        title: "Ranking generado",
        description: "El ranking ha sido generado exitosamente.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el ranking.",
        variant: "destructive",
      })
    }
  }

  const handlePublishRanking = async (country: string, year: number) => {
    try {
      await publishRanking(country, year)

      // Refresh the list
      const periodsRef = await getActiveVotingPeriods()
      setVotingPeriods(periodsRef)

      toast({
        title: "Ranking publicado",
        description: "El ranking ha sido publicado exitosamente.",
      })
    } catch (error) {
      console.error("Error publishing ranking:", error)
      toast({
        title: "Error",
        description: "No se pudo publicar el ranking.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Periodos de Votación</CardTitle>
            <CardDescription>Administra los periodos de votación para los rankings de DJs.</CardDescription>
          </div>
          <Button onClick={handleCreatePeriod}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo periodo
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>País</TableHead>
                    <TableHead>Año</TableHead>
                    <TableHead>Sugerencias</TableHead>
                    <TableHead>Votaciones</TableHead>
                    <TableHead>Resultados</TableHead>
                    <TableHead>Top</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votingPeriods.length > 0 ? (
                    votingPeriods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell>
                          {countries.find((c) => c.value === period.country)?.label || period.country}
                        </TableCell>
                        <TableCell>{period.year}</TableCell>
                        <TableCell>
                          {period.suggestionsOpen ? (
                            <Badge className="bg-green-500">Abiertas</Badge>
                          ) : (
                            <Badge variant="outline">Cerradas</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {period.votingOpen ? (
                            <Badge className="bg-green-500">Abiertas</Badge>
                          ) : (
                            <Badge variant="outline">Cerradas</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {period.resultsPublished ? (
                            <Badge className="bg-green-500">Publicados</Badge>
                          ) : (
                            <Badge variant="outline">No publicados</Badge>
                          )}
                        </TableCell>
                        <TableCell>Top {period.topCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditPeriod(period.id)}>
                              <Edit className="h-4 w-4 mr-1" /> Editar
                            </Button>

                            {!period.resultsPublished && !period.votingOpen && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateRanking(period.country, period.year)}
                              >
                                <Trophy className="h-4 w-4 mr-1" /> Generar
                              </Button>
                            )}

                            {!period.resultsPublished && (
                              <Button size="sm" onClick={() => handlePublishRanking(period.country, period.year)}>
                                <Check className="h-4 w-4 mr-1" /> Publicar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No se encontraron periodos de votación.
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? "Crear nuevo periodo de votación" : "Editar periodo de votación"}</DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Configura un nuevo periodo de votación para un ranking de DJs."
                : "Modifica la configuración del periodo de votación."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isCreating}>
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
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Año</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number.parseInt(value))}
                        defaultValue={field.value.toString()}
                        disabled={!isCreating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un año" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[2023, 2024, 2025, 2026, 2027].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="topCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad de DJs en el ranking</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number.parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la cantidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[10, 20, 50, 100].map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            Top {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Cantidad de DJs que aparecerán en el ranking final</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="suggestionsOpen"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Sugerencias abiertas</FormLabel>
                        <FormDescription>Permitir a los usuarios sugerir nuevos DJs</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="votingOpen"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Votaciones abiertas</FormLabel>
                        <FormDescription>Permitir a los usuarios votar por sus DJs favoritos</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resultsPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Resultados publicados</FormLabel>
                        <FormDescription>Mostrar los resultados del ranking al público</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit">{isCreating ? "Crear periodo" : "Guardar cambios"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
