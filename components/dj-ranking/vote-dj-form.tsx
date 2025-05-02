"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { getDJsByCountry } from "@/lib/firebase/djs"
import { getUserVotes, submitVotes, getVotingPeriod } from "@/lib/firebase/voting"
import type { DJ, VotingPeriod } from "@/types/dj-ranking"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, Music } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export function VoteDJForm() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [djs, setDjs] = useState<DJ[]>([])
  const [selectedDjs, setSelectedDjs] = useState<string[]>([])
  const [votingPeriod, setVotingPeriod] = useState<VotingPeriod | null>(null)
  const [country, setCountry] = useState("peru")
  const [year, setYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState("")
  const [hasVoted, setHasVoted] = useState(false)

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

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Check if voting is open for this country/year
        const period = await getVotingPeriod(country, year)
        setVotingPeriod(period)

        if (!period || !period.votingOpen) {
          setDjs([])
          setIsLoading(false)
          return
        }

        // Load DJs for this country
        const djsList = await getDJsByCountry(country)
        setDjs(djsList)

        // Check if user has already voted
        const userVotes = await getUserVotes(user.id, country, year)
        if (userVotes) {
          setSelectedDjs(userVotes.votes)
          setHasVoted(true)
        } else {
          setSelectedDjs([])
          setHasVoted(false)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los DJs.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, country, year, toast])

  const handleToggleDJ = (djId: string) => {
    if (hasVoted) return // Can't change votes after submitting

    if (selectedDjs.includes(djId)) {
      // Remove DJ from selection
      setSelectedDjs(selectedDjs.filter((id) => id !== djId))
    } else {
      // Add DJ to selection (if less than 5)
      if (selectedDjs.length < 5) {
        setSelectedDjs([...selectedDjs, djId])
      } else {
        toast({
          title: "Límite alcanzado",
          description: "Solo puedes votar por 5 DJs.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmitVotes = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para votar.",
        variant: "destructive",
      })
      return
    }

    if (selectedDjs.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un DJ.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await submitVotes({
        userId: user.id,
        country,
        year,
        votes: selectedDjs,
      })

      toast({
        title: "¡Gracias por tu voto!",
        description: "Tus votos han sido registrados exitosamente.",
      })
      setHasVoted(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un error al enviar tus votos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDjs = djs.filter(
    (dj) =>
      dj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dj.instagram.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!votingPeriod || !votingPeriod.votingOpen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Votaciones cerradas</CardTitle>
          <CardDescription>
            Las votaciones para {countries.find((c) => c.value === country)?.label} {year} no están abiertas en este
            momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecciona un país" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year.toString()} onValueChange={(value) => setYear(Number.parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecciona un año" />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vota por tus DJs favoritos</CardTitle>
          <CardDescription>
            Selecciona hasta 5 DJs para el ranking de {countries.find((c) => c.value === country)?.label} {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-4">
              <Select value={country} onValueChange={setCountry} disabled={hasVoted || isLoading}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={year.toString()}
                onValueChange={(value) => setYear(Number.parseInt(value))}
                disabled={hasVoted || isLoading}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecciona un año" />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Input
                placeholder="Buscar DJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
              <Badge variant="outline">{selectedDjs.length}/5 seleccionados</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDjs.map((dj) => (
              <Card
                key={dj.id}
                className={`cursor-pointer transition-all ${
                  selectedDjs.includes(dj.id) ? "border-green-500 shadow-md" : ""
                }`}
                onClick={() => handleToggleDJ(dj.id)}
              >
                <CardContent className="p-4 flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    {dj.photoUrl ? (
                      <AvatarImage src={dj.photoUrl || "/placeholder.svg"} alt={dj.name} />
                    ) : (
                      <AvatarFallback>
                        <Music className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">{dj.name}</h3>
                    <p className="text-sm text-gray-500">@{dj.instagram}</p>
                  </div>
                  <div className="flex items-center justify-center h-6 w-6 rounded-full border">
                    {selectedDjs.includes(dj.id) && <Check className="h-4 w-4 text-green-500" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDjs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p>No se encontraron DJs para este país.</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSubmitVotes} disabled={selectedDjs.length === 0 || hasVoted || isLoading}>
              {hasVoted ? "Votos enviados" : "Enviar votos"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
