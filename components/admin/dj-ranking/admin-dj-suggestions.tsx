"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getAllDJSuggestions, approveDJSuggestion } from "@/lib/firebase/dj-suggestions"
import type { DJSuggestion } from "@/types/dj-ranking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Search, ThumbsUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/auth-context"

export function AdminDJSuggestions() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<DJSuggestion[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<DJSuggestion[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [approvedFilter, setApprovedFilter] = useState("")

  // List of countries
  const countries = [
    { value: "all", label: "Todos los países" }, // Changed from empty string to "all"
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
    const loadSuggestions = async () => {
      setIsLoading(true)
      try {
        const allSuggestions = await getAllDJSuggestions()
        setSuggestions(allSuggestions)
        setFilteredSuggestions(allSuggestions)
      } catch (error) {
        console.error("Error loading DJ suggestions:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las sugerencias de DJs.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSuggestions()
  }, [toast])

  useEffect(() => {
    // Apply filters
    let filtered = [...suggestions]

    if (searchTerm) {
      filtered = filtered.filter(
        (suggestion) =>
          suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          suggestion.instagram.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Updated to check for "all" instead of empty string
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

  return (
    <div className="space-y-6">
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
    </div>
  )
}
