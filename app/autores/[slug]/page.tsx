import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getAuthorBySlug, getAuthorById } from "@/lib/firebase/authors"
import AuthorProfile from "@/components/team/author-profile"
import { generateSlug } from "@/lib/utils"

interface AuthorPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params

  // Verificar si el slug es un ID o un nombre formateado
  const isId = !slug.includes("-")

  let author
  if (isId) {
    author = await getAuthorById(slug)
  } else {
    author = await getAuthorBySlug(slug)
  }

  if (!author) {
    return {
      title: "Autor no encontrado | Ravehub Latam",
      description: "El autor que buscas no existe o no está disponible.",
    }
  }

  return {
    title: `${author.firstName} ${author.lastName} | Ravehub Latam`,
    description: `Conoce más sobre ${author.firstName} ${author.lastName}, miembro del equipo de Ravehub Latam.`,
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params

  // Verificar si el slug es un ID o un nombre formateado
  const isId = !slug.includes("-")

  let author
  if (isId) {
    author = await getAuthorById(slug)

    if (author) {
      // Redirigir a la URL con el formato de nombre
      const nameSlug = generateSlug(`${author.firstName} ${author.lastName}`)
      redirect(`/autores/${nameSlug}`)
    }
  } else {
    author = await getAuthorBySlug(slug)
  }

  if (!author) {
    notFound()
  }

  return <AuthorProfile author={author} />
}
