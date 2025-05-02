import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { UserData } from "./users"
import { generateSlug } from "@/lib/utils"

// Obtener todos los usuarios con rol "admin"
export async function getAdminUsers(): Promise<UserData[]> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("role", "==", "admin"), where("isActive", "==", true))
    const querySnapshot = await getDocs(q)

    const adminUsers: UserData[] = []
    querySnapshot.forEach((doc) => {
      adminUsers.push({
        id: doc.id,
        ...doc.data(),
      } as UserData)
    })

    return adminUsers
  } catch (error) {
    console.error("Error al obtener usuarios admin:", error)
    return []
  }
}

// Obtener autor por ID
export async function getAuthorById(id: string): Promise<UserData | null> {
  try {
    const userRef = doc(db, "users", id)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists() || userSnap.data().role !== "admin") {
      return null
    }

    return {
      id: userSnap.id,
      ...userSnap.data(),
    } as UserData
  } catch (error) {
    console.error("Error al obtener autor por ID:", error)
    return null
  }
}

// Obtener autor por slug (firstName-lastName)
export async function getAuthorBySlug(slug: string): Promise<UserData | null> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("role", "==", "admin"))
    const querySnapshot = await getDocs(q)

    let matchedAuthor: UserData | null = null

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserData
      const userSlug = generateSlug(`${userData.firstName} ${userData.lastName}`)

      if (userSlug === slug) {
        matchedAuthor = {
          id: doc.id,
          ...userData,
        }
      }
    })

    return matchedAuthor
  } catch (error) {
    console.error("Error al obtener autor por slug:", error)
    return null
  }
}
