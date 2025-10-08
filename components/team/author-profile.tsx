import Image from "next/image"
import type { UserData } from "@/lib/firebase/users"
import { PageHeader } from "@/components/page-header"

interface AuthorProfileProps {
  author: UserData
}

// Función para convertir código de país a emoji de bandera
const getCountryFlag = (countryCode: string) => {
  // Convertir código de país a emoji de bandera
  // Los emojis de banderas son pares de letras regionales indicadoras
  // que están 127397 puntos de código después de sus letras ASCII mayúsculas
  const codePoints = [...countryCode.toUpperCase()].map((char) => char.charCodeAt(0) + 127397)
  return String.fromCodePoint(...codePoints)
}

export default function AuthorProfile({ author }: AuthorProfileProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader heading={`${author.firstName} ${author.lastName}`} text="Perfil de autor" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-1">
          <div className="relative h-64 w-64 mx-auto rounded-lg overflow-hidden mb-4 shadow-lg">
            {author.photoURL ? (
              <Image
                src={author.photoURL || "/placeholder.svg"}
                alt={`${author.firstName} ${author.lastName}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-6xl font-bold text-gray-400">
                  {author.firstName?.[0]}
                  {author.lastName?.[0]}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-4">
            <h3 className="text-lg font-semibold mb-4">Información de contacto</h3>
            <div className="space-y-3">
              <p className="flex items-center">
                <span className="font-medium mr-2">Email:</span>
                <a href={`mailto:${author.email}`} className="text-blue-600 hover:underline">
                  {author.email}
                </a>
              </p>
              {author.phone && (
                <p className="flex items-center">
                  <span className="font-medium mr-2">Teléfono:</span>
                  <a href={`tel:${author.phonePrefix}${author.phone}`} className="text-blue-600 hover:underline">
                    {author.phonePrefix} {author.phone}
                  </a>
                </p>
              )}
              {author.country && (
                <p className="flex items-center">
                  <span className="font-medium mr-2">País:</span>
                  <span className="flex items-center">
                    <span className="mr-2 text-xl">{getCountryFlag(author.country)}</span>
                    {author.country}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Sobre {author.firstName}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {author.bio ||
                `${author.firstName} ${author.lastName} es parte del equipo de Ravehub Latam, contribuyendo con su experiencia y conocimiento para ofrecer la mejor experiencia en eventos.`}
            </p>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Detalles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Miembro desde</p>
                  <p className="font-medium">
                    {author.createdAt && typeof author.createdAt === "object" && "toDate" in author.createdAt
                      ? new Intl.DateTimeFormat("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(author.createdAt.toDate())
                      : "Fecha no disponible"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Última actividad</p>
                  <p className="font-medium">
                    {author.lastLoginAt && typeof author.lastLoginAt === "object" && "toDate" in author.lastLoginAt
                      ? new Intl.DateTimeFormat("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(author.lastLoginAt.toDate())
                      : author.lastLogin && typeof author.lastLogin === "object" && "toDate" in author.lastLogin
                        ? new Intl.DateTimeFormat("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(author.lastLogin.toDate())
                        : "Fecha no disponible"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Última actualización</p>
                  <p className="font-medium">
                    {author.updatedAt && typeof author.updatedAt === "object" && "toDate" in author.updatedAt
                      ? new Intl.DateTimeFormat("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(author.updatedAt.toDate())
                      : "Fecha no disponible"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                  <p className="font-medium">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${author.isActive ? "bg-green-500" : "bg-red-500"}`}
                    ></span>
                    {author.isActive ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
