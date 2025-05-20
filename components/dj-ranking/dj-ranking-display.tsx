"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getRanking, getVotingPeriod } from "@/lib/firebase/voting"
import type { Ranking, VotingPeriod } from "@/types/dj-ranking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Instagram, Music, Trophy } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DJRankingDisplay() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [votingPeriod, setVotingPeriod] = useState<VotingPeriod | null>(null)
  const [country, setCountry] = useState("peru")
  const [year, setYear] = useState(new Date().getFullYear())

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
      setIsLoading(true)
      try {
        // Check if voting period exists and if results are published
        const period = await getVotingPeriod(country, year)
        setVotingPeriod(period)

        // Get ranking if results are published
        if (period && period.resultsPublished) {
          const rankingData = await getRanking(country, year)
          setRanking(rankingData)
        } else {
          setRanking(null)
        }
      } catch (error) {
        console.error("Error loading ranking:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el ranking.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [country, year, toast])

  const getPositionBadgeColor = (position: number) => {
    if (position === 1) return "bg-yellow-500"
    if (position === 2) return "bg-gray-400"
    if (position === 3) return "bg-amber-700"
    return "bg-gray-200 text-gray-700"
  }

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            Top DJs {countries.find((c) => c.value === country)?.label} {year}
          </CardTitle>
          <CardDescription>
            {votingPeriod?.resultsPublished
              ? `Ranking oficial de los mejores DJs de ${countries.find((c) => c.value === country)?.label} ${year}`
              : "Los resultados aún no han sido publicados"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
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

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {ranking && ranking.djs.length > 0 ? (
            <div className="space-y-4">
              {ranking.djs.map((dj) => (
                <Card key={dj.djId} className="overflow-hidden w-full">
                  <div className="flex items-center p-4">
                    <div
                      className={`flex items-center justify-center h-10 w-10 rounded-full ${getPositionBadgeColor(dj.position)} text-white font-bold mr-4`}
                    >
                      {dj.position}
                    </div>
                    <Avatar className="h-16 w-16 mr-4">
                      {dj.photoUrl ? (
                        <AvatarImage src={dj.photoUrl || "/placeholder.svg"} alt={dj.name} />
                      ) : (
                        <AvatarFallback>
                          <Music className="h-8 w-8" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{dj.name}</h3>
                      <div className="flex items-center text-gray-500">
                        <Instagram className="h-4 w-4 mr-1" />
                        <span>@{dj.instagram}</span>
                      </div>
                    </div>
                    {dj.position <= 3 && (
                      <Trophy
                        className={`h-6 w-6 ${
                          dj.position === 1 ? "text-yellow-500" : dj.position === 2 ? "text-gray-400" : "text-amber-700"
                        }`}
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="w-full">
              <CardContent className="p-8 text-center">
                {votingPeriod ? (
                  votingPeriod.resultsPublished ? (
                    <p>No hay resultados disponibles para este ranking.</p>
                  ) : (
                    <p>Los resultados aún no han sido publicados.</p>
                  )
                ) : (
                  <p>No se encontró un periodo de votación para este país y año.</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
