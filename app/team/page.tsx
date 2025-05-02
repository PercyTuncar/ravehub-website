import type { Metadata } from "next"
import TeamMembersList from "@/components/team/team-members-list"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Nuestro Equipo | RaveHub Latam",
  description:
    "Conoce al equipo detrás de RaveHub Latam, los expertos que hacen posible la mejor experiencia en eventos.",
}

export const viewport = {
  themeColor: "#000000",
}

export default function TeamPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader heading="Nuestro Equipo" text="Conoce a las personas que hacen posible RaveHub Latam" />
      <TeamMembersList />
    </div>
  )
}
