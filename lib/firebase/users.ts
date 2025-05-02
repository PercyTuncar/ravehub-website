import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase"

// Tipo para los datos del usuario según la estructura en Firebase
export interface UserData {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
  documentType?: string
  documentNumber?: string
  country?: string
  phone?: string
  phonePrefix?: string
  preferredCurrency?: string
  role?: string
  isActive?: boolean
  createdAt?: any
  updatedAt?: any
  photoURL?: string // Para la foto de perfil
}

// Obtener todos los usuarios
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const usersRef = collection(db, "users")
    const querySnapshot = await getDocs(usersRef)

    const users: UserData[] = []
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      } as UserData)
    })

    // Ordenar por nombre para facilitar la selección
    return users.sort((a, b) => {
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase()
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase()
      return nameA.localeCompare(nameB)
    })
  } catch (error) {
    console.error("Error al obtener todos los usuarios:", error)
    return []
  }
}

// Obtener usuario por email
export async function getUserByEmail(email: string): Promise<UserData | null> {
  if (!email) return null

  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    } as UserData
  } catch (error) {
    console.error("Error al obtener usuario por email:", error)
    return null
  }
}

// Obtener usuario por ID
export async function getUserById(uid: string): Promise<UserData | null> {
  if (!uid) return null

  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return null
    }

    return {
      id: userSnap.id,
      ...userSnap.data(),
    } as UserData
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error)
    return null
  }
}

// Actualizar perfil de usuario
export async function updateUserProfile(uid: string, data: Partial<UserData>): Promise<boolean> {
  if (!uid) return false

  try {
    const userRef = doc(db, "users", uid)

    // Verificar que el usuario existe antes de actualizar
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      console.error("Intento de actualizar un usuario que no existe:", uid)
      return false
    }

    // Validar datos antes de actualizar
    const validatedData: Record<string, any> = {}

    // Validar y sanitizar cada campo
    if (data.email !== undefined) {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        console.error("Formato de email inválido")
        return false
      }
      validatedData.email = data.email
    }

    if (data.phone !== undefined) {
      // Sanitizar teléfono (solo dígitos)
      validatedData.phone = data.phone.replace(/\D/g, "")
    }

    // Incluir photoURL si está presente
    if (data.photoURL !== undefined) {
      validatedData.photoURL = data.photoURL
    }
    // Copiar otros campos que no necesitan validación especial
    ;[
      "firstName",
      "lastName",
      "country",
      "documentType",
      "documentNumber",
      "phonePrefix",
      "preferredCurrency",
      "role",
      "isActive",
    ].forEach((field) => {
      if (data[field] !== undefined) {
        validatedData[field] = data[field]
      }
    })

    // Añadir timestamp de actualización
    validatedData.updatedAt = new Date()

    await updateDoc(userRef, validatedData)
    return true
  } catch (error) {
    console.error("Error al actualizar perfil de usuario:", error)
    return false
  }
}

// Subir imagen de perfil
export async function uploadProfileImage(uid: string, file: File): Promise<string | null> {
  if (!uid) return null

  try {
    // Crear referencia para la imagen
    const storageRef = ref(storage, `profile_images/${uid}/${Date.now()}_${file.name}`)

    // Subir archivo
    const snapshot = await uploadBytes(storageRef, file)

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref)

    return downloadURL
  } catch (error) {
    console.error("Error al subir imagen de perfil:", error)
    return null
  }
}

// Crear usuario si no existe
export async function createUserIfNotExists(userData: UserData): Promise<string | null> {
  try {
    if (!userData.id || !userData.email) {
      throw new Error("UID y email son requeridos")
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      throw new Error("Formato de email inválido")
    }

    const userRef = doc(db, "users", userData.id)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Sanitizar datos antes de guardar
      const sanitizedData = {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        firstName: (userData.firstName || "").trim(),
        lastName: (userData.lastName || "").trim(),
        phone: userData.phone ? userData.phone.replace(/\D/g, "") : "",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await setDoc(userRef, sanitizedData)
    }

    return userData.id
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return null
  }
}
