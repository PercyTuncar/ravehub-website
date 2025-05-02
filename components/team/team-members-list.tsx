"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAdminUsers } from "@/lib/firebase/authors"
import type { UserData } from "@/lib/firebase/users"
import TeamMemberCard from "./team-member-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function TeamMembersList() {
  const [teamMembers, setTeamMembers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const members = await getAdminUsers()
        setTeamMembers(members)
      } catch (error) {
        console.error("Error fetching team members:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamMembers()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex flex-col items-center space-y-4">
            <Skeleton className="h-48 w-48 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    )
  }

  if (teamMembers.length === 0) {
    return <p className="text-center py-12">No se encontraron miembros del equipo.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
      {teamMembers.map((member) => (
        <Link key={member.id} href={`/autores/${member.firstName?.toLowerCase()}-${member.lastName?.toLowerCase()}`}>
          <TeamMemberCard member={member} />
        </Link>
      ))}
    </div>
  )
}
