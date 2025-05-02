import { getCurrentUserData } from "../firebase/auth"

export async function isAdminUser() {
  try {
    const userData = await getCurrentUserData()

    if (!userData) {
      console.log("No user data found when checking admin status")
      return false
    }

    const isAdmin = userData.role === "admin"
    console.log("Admin check:", { userId: userData.id, isAdmin })

    return isAdmin
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

export async function requireAdmin() {
  const isAdmin = await isAdminUser()

  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  return true
}
