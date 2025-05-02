"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { getUserById } from "@/lib/firebase/users"
import ProfileForm from "./profile-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileWrapper() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Usuario autenticado, obtener datos de Firestore
          const userProfile = await getUserById(user.uid)

          if (userProfile) {
            setUserData(userProfile)
          } else {
            console.error("No se encontró el perfil del usuario")
            router.push("/login?callbackUrl=/perfil")
          }
        } catch (error) {
          console.error("Error al cargar el perfil:", error)
        } finally {
          setLoading(false)
        }
      } else {
        // No hay usuario autenticado, redirigir al login
        router.push("/login?callbackUrl=/perfil")
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return <ProfileForm initialData={userData} userEmail={userData.email} />
}
