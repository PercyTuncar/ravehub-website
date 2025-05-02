import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

/**
 * Aprueba una sugerencia de DJ
 * @param djId ID del DJ a aprobar
 * @param adminId ID del administrador que aprueba
 */
export async function approveDJSuggestion(djId: string, adminId: string) {
  try {
    const djRef = doc(db, "djs", djId)
    await updateDoc(djRef, {
      approved: true,
      approvedBy: adminId,
      approvedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error("Error approving DJ suggestion:", error)
    throw error
  }
}

/**
 * Rechaza una sugerencia de DJ
 * @param djId ID del DJ a rechazar
 * @param adminId ID del administrador que rechaza
 * @param reason Razón del rechazo
 */
export async function rejectDJSuggestion(djId: string, adminId: string, reason: string) {
  try {
    const djRef = doc(db, "djs", djId)
    await updateDoc(djRef, {
      rejected: true,
      rejectedBy: adminId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    })
    return true
  } catch (error) {
    console.error("Error rejecting DJ suggestion:", error)
    throw error
  }
}
