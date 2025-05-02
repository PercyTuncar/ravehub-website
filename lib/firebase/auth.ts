import { auth } from "./firebase"
import { onAuthStateChanged, signOut, getAuth } from "firebase/auth"
import { getUserById } from "./users"
import type { User } from "@/types"
import {
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
import { getUserByEmail } from "./users"

// Función para obtener el estado actual de autenticación
export function getAuthStatus() {
  const currentAuth = getAuth()
  const currentUser = currentAuth.currentUser

  return {
    isAuthenticated: !!currentUser,
    // No incluir información sensible en el objeto de retorno
    authStateReady: !currentAuth.authStateReady,
  }
}

// Obtener el usuario actual con promesa y verificación de token
export function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe()

        if (user) {
          try {
            // Verificar que el token sea válido
            await user.getIdToken(true)
            resolve(user)
          } catch (tokenError) {
            console.error("Error al verificar token:", tokenError)
            // Si hay error con el token, forzar logout
            await signOut(auth)
            resolve(null)
          }
        } else {
          resolve(null)
        }
      },
      (error) => {
        console.error("Error en onAuthStateChanged:", error)
        reject(error)
      },
    )
  })
}

// Cerrar sesión
export async function signOutUser() {
  try {
    await signOut(auth)
    // Eliminado console.log por seguridad
    return true
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    return false
  }
}

// Obtener datos completos del usuario actual con reintentos
export async function getCurrentUserData(retryCount = 3): Promise<User | null> {
  try {
    // Eliminado console.log por seguridad

    // Verificar el estado actual de autenticación
    const authStatus = getAuthStatus()
    // Eliminado console.log por seguridad

    const user = await getCurrentUser()
    if (!user) {
      // Eliminado console.log por seguridad
      return null
    }

    // Eliminado console.log por seguridad

    let userData = await getUserById(user.uid)
    // Eliminado console.log por seguridad

    // Implementar reintentos si no se encuentra el usuario
    let attempts = 0
    while (!userData && attempts < retryCount) {
      // Eliminado console.log por seguridad
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempts + 1))) // Esperar con backoff
      userData = await getUserById(user.uid)
      attempts++
    }

    if (!userData) {
      // Eliminado console.log por seguridad
      return null
    }

    // Eliminado console.log por seguridad
    return userData
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error)
    return null
  }
}

// Verificar si hay inconsistencias entre Firebase Auth y Firestore
export async function verifyAuthConsistency(): Promise<{
  isAuthenticated: boolean
  hasFirestoreData: boolean
  isConsistent: boolean
}> {
  try {
    const firebaseUser = await getCurrentUser()
    const isAuthenticated = !!firebaseUser

    let hasFirestoreData = false
    let isConsistent = true

    if (isAuthenticated && firebaseUser) {
      // Verificar token antes de continuar
      try {
        await firebaseUser.getIdToken(true)
      } catch (tokenError) {
        console.error("Error al verificar token en consistencia:", tokenError)
        return { isAuthenticated: false, hasFirestoreData: false, isConsistent: false }
      }

      const userData = await getUserById(firebaseUser.uid)
      hasFirestoreData = !!userData
      isConsistent = isAuthenticated === hasFirestoreData

      // Log seguro sin exponer datos sensibles
      // Eliminado console.log por seguridad
    }

    return { isAuthenticated, hasFirestoreData, isConsistent }
  } catch (error) {
    console.error("Error verificando consistencia de autenticación:", error)
    return { isAuthenticated: false, hasFirestoreData: false, isConsistent: false }
  }
}

// Función para iniciar sesión con Google
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    // Solicitar el perfil del usuario y el email
    provider.addScope("profile")
    provider.addScope("email")

    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const credential = GoogleAuthProvider.credentialFromResult(result)

    // Verificar si el email ya existe en otro método de autenticación
    if (user.email) {
      const methods = await fetchSignInMethodsForEmail(auth, user.email)

      // Si el usuario existe con email/password pero no con Google
      if (methods.includes("password") && !methods.includes("google.com")) {
        // El usuario ya existe con email/password, debemos vincular la cuenta de Google
        return {
          user,
          credential,
          isNewUser: false,
          needsLinking: true,
          methods,
        }
      }

      // Verificar si el usuario existe en Firestore
      const firestoreUser = await getUserByEmail(user.email)

      if (!firestoreUser) {
        // El usuario no existe en Firestore, necesita completar el registro
        return {
          user,
          credential,
          isNewUser: true,
          needsLinking: false,
          methods,
        }
      }
    }

    return {
      user,
      credential,
      isNewUser: false,
      needsLinking: false,
      methods: [],
    }
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error)
    throw error
  }
}

// Función para vincular cuenta de Google a una cuenta existente
export async function linkGoogleAccount(currentUser: any) {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)

    if (credential && currentUser) {
      await linkWithCredential(currentUser, credential)
      return true
    }
    return false
  } catch (error) {
    console.error("Error al vincular cuenta de Google:", error)
    throw error
  }
}

// Función para establecer contraseña en cuenta de Google
export async function setPasswordForGoogleUser(password: string) {
  try {
    const user = auth.currentUser
    if (!user || !user.email) {
      throw new Error("Usuario no autenticado o sin email")
    }

    // Crear credencial de email/contraseña
    const credential = EmailAuthProvider.credential(user.email, password)

    // Vincular la credencial al usuario actual
    await linkWithCredential(user, credential)
    return true
  } catch (error) {
    console.error("Error al establecer contraseña:", error)
    throw error
  }
}

// Función para verificar si un email ya existe
export async function checkIfEmailExists(email: string) {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email)
    return methods.length > 0
  } catch (error) {
    console.error("Error al verificar email:", error)
    return false
  }
}
