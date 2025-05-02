import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  writeBatch,
  Timestamp,
  serverTimestamp,
  getFirestore,
  setDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase/config"
import type { TicketTransaction, TicketItem, PaymentInstallment, User, Event } from "@/types"
import { v4 as uuidv4 } from "uuid"

// Helper function to remove undefined values from an object
function removeUndefinedValues(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}

// Create a new ticket transaction
export async function createTicketTransaction(
  transaction: TicketTransaction,
  installments: PaymentInstallment[] = [],
): Promise<void> {
  try {
    // Validar que userId existe
    if (!transaction.userId) {
      throw new Error("userId is required for ticket transaction")
    }

    const batch = writeBatch(db)

    // Eliminar valores undefined antes de guardar en Firestore
    const cleanTransaction = removeUndefinedValues({
      ...transaction,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Add transaction to Firestore
    const transactionRef = doc(db, "ticketTransactions", transaction.id)
    batch.set(transactionRef, cleanTransaction)

    // Ya no guardamos los tickets como documentos separados
    // Los tickets se guardan como parte del array ticketItems en la transacción

    // Add installments to Firestore if applicable
    if (installments.length > 0) {
      installments.forEach((installment) => {
        const installmentRef = doc(db, "paymentInstallments", installment.id)
        const cleanInstallment = removeUndefinedValues({
          ...installment,
          dueDate: Timestamp.fromDate(installment.dueDate),
        })
        batch.set(installmentRef, cleanInstallment)
      })
    }

    // Commit the batch
    await batch.commit()
  } catch (error) {
    console.error("Error creating ticket transaction:", error)
    throw error
  }
}

// Upload payment proof
export async function uploadPaymentProof(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading payment proof:", error)
    throw error
  }
}

// Mejorar la función getUserTicketTransactions para manejar mejor las fechas
export async function getUserTicketTransactions(userId: string): Promise<TicketTransaction[]> {
  try {
    const q = query(collection(db, "ticketTransactions"), where("userId", "==", userId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const transactions: TicketTransaction[] = []

    for (const doc of querySnapshot.docs) {
      const transaction = doc.data() as TicketTransaction

      // Ya no necesitamos buscar tickets en una colección separada
      // Los tickets ya están en el array ticketItems de la transacción

      // Get installments if applicable
      let installments: PaymentInstallment[] = []
      if (transaction.paymentType === "installment") {
        const installmentsQuery = query(
          collection(db, "paymentInstallments"),
          where("transactionId", "==", transaction.id),
          orderBy("installmentNumber", "asc"),
        )
        const installmentsSnapshot = await getDocs(installmentsQuery)
        installments = installmentsSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ...data,
            id: doc.id, // Asegurarse de que el ID esté presente
            dueDate: convertFirestoreDate(data.dueDate),
            paymentDate: convertFirestoreDate(data.paymentDate),
            approvedAt: convertFirestoreDate(data.approvedAt),
          } as PaymentInstallment
        })
      }

      transactions.push({
        ...transaction,
        id: doc.id, // Asegurarse de que el ID esté presente
        createdAt: convertFirestoreDate(transaction.createdAt),
        updatedAt: convertFirestoreDate(transaction.updatedAt),
        ticketsDownloadAvailableDate: convertFirestoreDate(transaction.ticketsDownloadAvailableDate),
        // Asegurarse de que ticketItems sea un array
        ticketItems: Array.isArray(transaction.ticketItems) ? transaction.ticketItems : [],
        installments,
      })
    }

    return transactions
  } catch (error) {
    console.error("Error getting user ticket transactions:", error)
    return []
  }
}

// Agregar esta función auxiliar para convertir fechas de Firestore
function convertFirestoreDate(date: any): Date | undefined {
  if (!date) return undefined

  if (date && typeof date.toDate === "function") {
    return date.toDate()
  } else if (date instanceof Date) {
    return date
  } else if (typeof date === "string" || typeof date === "number") {
    const parsedDate = new Date(date)
    return isNaN(parsedDate.getTime()) ? undefined : parsedDate
  }

  return undefined
}

// Get all pending ticket transactions (for admin)
export async function getPendingTicketTransactions(): Promise<TicketTransaction[]> {
  try {
    const q = query(
      collection(db, "ticketTransactions"),
      where("paymentStatus", "==", "pending"),
      orderBy("createdAt", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const transactions: TicketTransaction[] = []

    for (const docSnapshot of querySnapshot.docs) {
      const transaction = docSnapshot.data() as TicketTransaction

      // Get user info
      const userDocRef = doc(db, "users", transaction.userId)
      const userDoc = await getDoc(userDocRef)
      const user = userDoc.exists() ? (userDoc.data() as User) : null

      // Get event info
      const eventDocRef = doc(db, "events", transaction.eventId)
      const eventDoc = await getDoc(eventDocRef)
      const event = eventDoc.exists() ? (eventDoc.data() as Event) : null

      // Ya no necesitamos buscar tickets en una colección separada
      // Los tickets ya están en el array ticketItems de la transacción
      const ticketItems = Array.isArray(transaction.ticketItems)
        ? transaction.ticketItems.map((item) => ({
            ...item,
            createdAt: typeof item.createdAt === "string" ? new Date(item.createdAt) : item.createdAt,
            updatedAt: typeof item.updatedAt === "string" ? new Date(item.updatedAt) : item.updatedAt,
          }))
        : []

      // Get installments if applicable
      let installments: PaymentInstallment[] = []
      if (transaction.paymentType === "installment") {
        const installmentsQuery = query(
          collection(db, "paymentInstallments"),
          where("transactionId", "==", transaction.id),
          orderBy("installmentNumber", "asc"),
        )
        const installmentsSnapshot = await getDocs(installmentsQuery)
        installments = installmentsSnapshot.docs.map((installmentDoc) => {
          const data = installmentDoc.data()
          return {
            ...data,
            id: installmentDoc.id,
            dueDate:
              data.dueDate && typeof data.dueDate.toDate === "function"
                ? data.dueDate.toDate()
                : data.dueDate instanceof Date
                  ? data.dueDate
                  : new Date(data.dueDate || Date.now()),
            paymentDate:
              data.paymentDate && typeof data.paymentDate.toDate === "function"
                ? data.paymentDate.toDate()
                : data.paymentDate instanceof Date
                  ? data.paymentDate
                  : data.paymentDate
                    ? new Date(data.paymentDate)
                    : undefined,
            approvedAt:
              data.approvedAt && typeof data.approvedAt.toDate === "function"
                ? data.approvedAt.toDate()
                : data.approvedAt instanceof Date
                  ? data.approvedAt
                  : data.approvedAt
                    ? new Date(data.approvedAt)
                    : undefined,
          } as PaymentInstallment
        })
      }

      transactions.push({
        ...transaction,
        id: docSnapshot.id,
        createdAt:
          transaction.createdAt && typeof transaction.createdAt.toDate === "function"
            ? transaction.createdAt.toDate()
            : transaction.createdAt instanceof Date
              ? transaction.createdAt
              : new Date(transaction.createdAt || Date.now()),
        updatedAt:
          transaction.updatedAt && typeof transaction.updatedAt.toDate === "function"
            ? transaction.updatedAt.toDate()
            : transaction.updatedAt instanceof Date
              ? transaction.updatedAt
              : new Date(transaction.updatedAt || Date.now()),
        ticketsDownloadAvailableDate:
          transaction.ticketsDownloadAvailableDate &&
          typeof transaction.ticketsDownloadAvailableDate.toDate === "function"
            ? transaction.ticketsDownloadAvailableDate.toDate()
            : transaction.ticketsDownloadAvailableDate instanceof Date
              ? transaction.ticketsDownloadAvailableDate
              : transaction.ticketsDownloadAvailableDate
                ? new Date(transaction.ticketsDownloadAvailableDate)
                : undefined,
        ticketItems,
        installments,
        user,
        event,
      })
    }

    return transactions
  } catch (error) {
    console.error("Error getting pending ticket transactions:", error)
    return []
  }
}

// Approve ticket transaction
export async function approveTicketTransaction(
  transactionId: string,
  adminId: string,
  adminNotes = "",
  ticketsDownloadAvailableDate: Date,
  ticketPdfUrls: string[] = [],
): Promise<void> {
  try {
    // Obtener la transacción actual
    const transactionRef = doc(db, "ticketTransactions", transactionId)
    const transactionDoc = await getDoc(transactionRef)

    if (!transactionDoc.exists()) {
      throw new Error(`Transaction with ID ${transactionId} not found`)
    }

    const transaction = transactionDoc.data() as TicketTransaction

    // Actualizar los tickets en el array
    let updatedTicketItems = []

    if (Array.isArray(transaction.ticketItems)) {
      updatedTicketItems = transaction.ticketItems.map((ticket, index) => ({
        ...ticket,
        status: "approved",
        ticketPdfUrl: index < ticketPdfUrls.length ? ticketPdfUrls[index] : ticket.ticketPdfUrl || "",
        updatedAt: new Date(),
      }))
    }

    // Actualizar la transacción
    await updateDoc(transactionRef, {
      paymentStatus: "approved",
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      adminNotes,
      ticketsDownloadAvailableDate: Timestamp.fromDate(ticketsDownloadAvailableDate),
      updatedAt: serverTimestamp(),
      ticketItems: updatedTicketItems,
    })

    // If installment payment, mark first installment as paid
    if (transaction.paymentType === "installment") {
      const installmentsQuery = query(
        collection(db, "paymentInstallments"),
        where("transactionId", "==", transactionId),
        where("installmentNumber", "==", 1),
      )
      const installmentsSnapshot = await getDocs(installmentsQuery)

      if (!installmentsSnapshot.empty) {
        const installmentRef = installmentsSnapshot.docs[0].ref
        await updateDoc(installmentRef, {
          status: "paid",
          paymentDate: serverTimestamp(),
          adminApproved: true,
          approvedBy: adminId,
          approvedAt: serverTimestamp(),
        })
      }
    }
  } catch (error) {
    console.error("Error approving ticket transaction:", error)
    throw error
  }
}

// Reject ticket transaction
export async function rejectTicketTransaction(transactionId: string, adminId: string, adminNotes = ""): Promise<void> {
  try {
    // Obtener la transacción actual
    const transactionRef = doc(db, "ticketTransactions", transactionId)
    const transactionDoc = await getDoc(transactionRef)

    if (!transactionDoc.exists()) {
      throw new Error(`Transaction with ID ${transactionId} not found`)
    }

    const transaction = transactionDoc.data() as TicketTransaction

    // Actualizar los tickets en el array
    let updatedTicketItems = []

    if (Array.isArray(transaction.ticketItems)) {
      updatedTicketItems = transaction.ticketItems.map((ticket) => ({
        ...ticket,
        status: "cancelled",
        updatedAt: new Date(),
      }))
    }

    // Actualizar la transacción
    await updateDoc(transactionRef, {
      paymentStatus: "rejected",
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      adminNotes,
      updatedAt: serverTimestamp(),
      ticketItems: updatedTicketItems,
    })

    // If installment payment, mark installments as cancelled
    const installmentsQuery = query(collection(db, "paymentInstallments"), where("transactionId", "==", transactionId))
    const installmentsSnapshot = await getDocs(installmentsQuery)

    const batch = writeBatch(db)
    installmentsSnapshot.docs.forEach((doc) => {
      const installmentRef = doc.ref
      batch.update(installmentRef, {
        status: "cancelled",
      })
    })

    await batch.commit()
  } catch (error) {
    console.error("Error rejecting ticket transaction:", error)
    throw error
  }
}

// Submit installment payment
export async function submitInstallmentPayment(installmentId: string, paymentProofUrl: string): Promise<void> {
  try {
    const installmentRef = doc(db, "paymentInstallments", installmentId)
    await updateDoc(installmentRef, {
      status: "pending",
      paymentProofUrl,
    })
  } catch (error) {
    console.error("Error submitting installment payment:", error)
    throw error
  }
}

// Approve installment payment
export async function approveInstallmentPayment(installmentId: string, adminId: string): Promise<void> {
  try {
    const installmentRef = doc(db, "paymentInstallments", installmentId)
    await updateDoc(installmentRef, {
      status: "paid",
      paymentDate: serverTimestamp(),
      adminApproved: true,
      approvedBy: adminId,
      approvedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error approving installment payment:", error)
    throw error
  }
}

// Reject installment payment
export async function rejectInstallmentPayment(installmentId: string, adminId: string, notes = ""): Promise<void> {
  try {
    const installmentRef = doc(db, "paymentInstallments", installmentId)
    await updateDoc(installmentRef, {
      status: "pending",
      adminApproved: false,
      notes,
    })
  } catch (error) {
    console.error("Error rejecting installment payment:", error)
    throw error
  }
}

// Upload ticket PDF
export async function uploadTicketPdf(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading ticket PDF:", error)
    throw error
  }
}

// Nominate ticket - Actualizada para trabajar solo con el array en la transacción
export async function nominateTicket(
  ticketId: string,
  nomineeFirstName: string,
  nomineeLastName: string,
  nomineeDocType: string,
  nomineeDocNumber: string,
  transactionId?: string,
): Promise<void> {
  try {
    if (!transactionId) {
      throw new Error("transactionId is required to nominate a ticket")
    }

    // Obtener la transacción
    const transactionRef = doc(db, "ticketTransactions", transactionId)
    const transactionDoc = await getDoc(transactionRef)

    if (!transactionDoc.exists()) {
      throw new Error(`Transaction with ID ${transactionId} not found`)
    }

    const transaction = transactionDoc.data() as TicketTransaction

    // Verificar si la transacción tiene un array de ticketItems
    if (!transaction.ticketItems || !Array.isArray(transaction.ticketItems)) {
      throw new Error(`Transaction ${transactionId} does not have a valid ticketItems array`)
    }

    // Buscar el ticket en el array
    const ticketIndex = transaction.ticketItems.findIndex((item) => item.id === ticketId)

    if (ticketIndex === -1) {
      throw new Error(`Ticket with ID ${ticketId} not found in transaction ${transactionId}`)
    }

    // Actualizar el ticket en el array
    const updatedTicketItems = [...transaction.ticketItems]
    updatedTicketItems[ticketIndex] = {
      ...updatedTicketItems[ticketIndex],
      isNominated: true,
      nomineeFirstName,
      nomineeLastName,
      nomineeDocType,
      nomineeDocNumber,
      updatedAt: new Date(),
    }

    // Actualizar la transacción
    await updateDoc(transactionRef, {
      ticketItems: updatedTicketItems,
      updatedAt: serverTimestamp(),
    })

    console.log(`Ticket ${ticketId} nominado exitosamente en la transacción ${transactionId}`)
  } catch (error) {
    console.error("Error nominating ticket:", error)
    throw error
  }
}

// Check if all installments are paid
export async function checkAllInstallmentsPaid(transactionId: string): Promise<boolean> {
  try {
    const installmentsQuery = query(collection(db, "paymentInstallments"), where("transactionId", "==", transactionId))
    const installmentsSnapshot = await getDocs(installmentsQuery)

    // Check if all installments are paid
    const allPaid = installmentsSnapshot.docs.every((doc) => doc.data().status === "paid")

    // If all paid, update transaction
    if (allPaid) {
      const transactionRef = doc(db, "ticketTransactions", transactionId)
      await updateDoc(transactionRef, {
        allInstallmentsPaid: true,
        updatedAt: serverTimestamp(),
      })
    }

    return allPaid
  } catch (error) {
    console.error("Error checking installments:", error)
    return false
  }
}

// Get pending installment payments for admin
export async function getPendingInstallmentPayments(): Promise<PaymentInstallment[]> {
  try {
    const q = query(
      collection(db, "paymentInstallments"),
      where("status", "==", "pending"),
      where("paymentProofUrl", "!=", ""),
      orderBy("paymentProofUrl"),
      orderBy("dueDate", "asc"),
    )

    const querySnapshot = await getDocs(q)
    const installments: PaymentInstallment[] = []

    for (const docSnapshot of querySnapshot.docs) {
      const installment = docSnapshot.data() as PaymentInstallment

      try {
        // Get transaction info
        const transactionDocRef = doc(db, "ticketTransactions", installment.transactionId)
        const transactionDoc = await getDoc(transactionDocRef)
        const transaction = transactionDoc.exists() ? (transactionDoc.data() as TicketTransaction) : null

        // Get user info
        let user = null
        if (transaction) {
          const userDocRef = doc(db, "users", transaction.userId)
          const userDoc = await getDoc(userDocRef)
          user = userDoc.exists() ? (userDoc.data() as User) : null
        }

        // Get event info
        let event = null
        if (transaction) {
          const eventDocRef = doc(db, "events", transaction.eventId)
          const eventDoc = await getDoc(eventDocRef)
          event = eventDoc.exists() ? (eventDoc.data() as Event) : null
        }

        installments.push({
          ...installment,
          id: docSnapshot.id,
          dueDate:
            installment.dueDate && typeof installment.dueDate.toDate === "function"
              ? installment.dueDate.toDate()
              : installment.dueDate instanceof Date
                ? installment.dueDate
                : new Date(installment.dueDate || Date.now()),
          paymentDate:
            installment.paymentDate && typeof installment.paymentDate.toDate === "function"
              ? installment.paymentDate.toDate()
              : installment.paymentDate instanceof Date
                ? installment.paymentDate
                : installment.paymentDate
                  ? new Date(installment.paymentDate)
                  : undefined,
          approvedAt:
            installment.approvedAt && typeof installment.approvedAt.toDate === "function"
              ? installment.approvedAt.toDate()
              : installment.approvedAt instanceof Date
                ? installment.approvedAt
                : installment.approvedAt
                  ? new Date(installment.approvedAt)
                  : undefined,
          transaction: transaction
            ? {
                ...transaction,
                createdAt:
                  transaction.createdAt && typeof transaction.createdAt.toDate === "function"
                    ? transaction.createdAt.toDate()
                    : transaction.createdAt instanceof Date
                      ? transaction.createdAt
                      : new Date(transaction.createdAt || Date.now()),
                updatedAt:
                  transaction.updatedAt && typeof transaction.updatedAt.toDate === "function"
                    ? transaction.updatedAt.toDate()
                    : transaction.updatedAt instanceof Date
                      ? transaction.updatedAt
                      : new Date(transaction.updatedAt || Date.now()),
                event,
              }
            : null,
          user,
        })
      } catch (err) {
        console.error(`Error processing installment ${docSnapshot.id}:`, err)
        // Skip this installment if there was an error
        continue
      }
    }

    return installments
  } catch (error) {
    console.error("Error getting pending installment payments:", error)
    return []
  }
}

// Mejorar la función updateTicketDownloadDate para manejar mejor las fechas
export async function updateTicketDownloadDate(transactionId: string, downloadDate: Date): Promise<void> {
  try {
    // Validar que la fecha es válida
    if (!(downloadDate instanceof Date) || isNaN(downloadDate.getTime())) {
      throw new Error("Invalid download date provided")
    }

    const transactionRef = doc(db, "ticketTransactions", transactionId)
    await updateDoc(transactionRef, {
      ticketsDownloadAvailableDate: Timestamp.fromDate(downloadDate),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating ticket download date:", error)
    throw error
  }
}

// Add or update the updateTicketPdf function to work with the ticketItems array in the transaction
export const updateTicketPdf = async (transactionId: string, ticketItemId: string, pdfUrl: string) => {
  try {
    const transactionRef = doc(db, "ticketTransactions", transactionId)
    const transactionDoc = await getDoc(transactionRef)

    if (!transactionDoc.exists()) {
      throw new Error("Transaction not found")
    }

    const transaction = transactionDoc.data()
    const ticketItems = transaction.ticketItems || []

    // Find the index of the ticket item to update
    const ticketIndex = ticketItems.findIndex((item: any) => item.id === ticketItemId)

    if (ticketIndex === -1) {
      throw new Error("Ticket item not found in transaction")
    }

    // Update the ticketPdfUrl in the ticketItems array
    await updateDoc(transactionRef, {
      [`ticketItems.${ticketIndex}.ticketPdfUrl`]: pdfUrl,
      [`ticketItems.${ticketIndex}.updatedAt`]: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error updating ticket PDF:", error)
    throw error
  }
}

// Obtener transacciones con tickets pagados completamente
export async function getPaidTicketTransactions(): Promise<TicketTransaction[]> {
  try {
    const q = query(
      collection(db, "ticketTransactions"),
      where("paymentStatus", "==", "approved"),
      orderBy("createdAt", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const transactions: TicketTransaction[] = []

    for (const docSnapshot of querySnapshot.docs) {
      const transaction = docSnapshot.data() as TicketTransaction

      // Verificar si es pago en cuotas y si todas las cuotas están pagadas
      let allInstallmentsPaid = true
      if (transaction.paymentType === "installment") {
        const installmentsQuery = query(
          collection(db, "paymentInstallments"),
          where("transactionId", "==", transaction.id),
        )
        const installmentsSnapshot = await getDocs(installmentsQuery)
        allInstallmentsPaid = installmentsSnapshot.docs.every((doc) => doc.data().status === "paid")

        // Si no todas las cuotas están pagadas, saltar esta transacción
        if (!allInstallmentsPaid) continue
      }

      // Get user info
      const userDocRef = doc(db, "users", transaction.userId)
      const userDoc = await getDoc(userDocRef)
      const user = userDoc.exists() ? (userDoc.data() as User) : null

      // Get event info
      const eventDocRef = doc(db, "events", transaction.eventId)
      const eventDoc = await getDoc(eventDocRef)
      const event = eventDoc.exists() ? (eventDoc.data() as Event) : null

      // Ya no necesitamos buscar tickets en una colección separada
      // Los tickets ya están en el array ticketItems de la transacción
      const ticketItems = Array.isArray(transaction.ticketItems)
        ? transaction.ticketItems.map((item) => ({
            ...item,
            createdAt: typeof item.createdAt === "string" ? new Date(item.createdAt) : item.createdAt,
            updatedAt: typeof item.updatedAt === "string" ? new Date(item.updatedAt) : item.updatedAt,
          }))
        : []

      // Get installments if applicable
      let installments: PaymentInstallment[] = []
      if (transaction.paymentType === "installment") {
        const installmentsQuery = query(
          collection(db, "paymentInstallments"),
          where("transactionId", "==", transaction.id),
          orderBy("installmentNumber", "asc"),
        )
        const installmentsSnapshot = await getDocs(installmentsQuery)
        installments = installmentsSnapshot.docs.map((installmentDoc) => {
          const data = installmentDoc.data()
          return {
            ...data,
            id: installmentDoc.id,
            dueDate:
              data.dueDate && typeof data.dueDate.toDate === "function"
                ? data.dueDate.toDate()
                : data.dueDate instanceof Date
                  ? data.dueDate
                  : new Date(data.dueDate || Date.now()),
            paymentDate:
              data.paymentDate && typeof data.paymentDate.toDate === "function"
                ? data.paymentDate.toDate()
                : data.paymentDate instanceof Date
                  ? data.paymentDate
                  : data.paymentDate
                    ? new Date(data.paymentDate)
                    : undefined,
            approvedAt:
              data.approvedAt && typeof data.approvedAt.toDate === "function"
                ? data.approvedAt.toDate()
                : data.approvedAt instanceof Date
                  ? data.approvedAt
                  : data.approvedAt
                    ? new Date(data.approvedAt)
                    : undefined,
          } as PaymentInstallment
        })
      }

      transactions.push({
        ...transaction,
        id: docSnapshot.id,
        createdAt:
          transaction.createdAt && typeof transaction.createdAt.toDate === "function"
            ? transaction.createdAt.toDate()
            : transaction.createdAt instanceof Date
              ? transaction.createdAt
              : new Date(transaction.createdAt || Date.now()),
        updatedAt:
          transaction.updatedAt && typeof transaction.updatedAt.toDate === "function"
            ? transaction.updatedAt.toDate()
            : transaction.updatedAt instanceof Date
              ? transaction.updatedAt
              : new Date(transaction.updatedAt || Date.now()),
        ticketsDownloadAvailableDate:
          transaction.ticketsDownloadAvailableDate &&
          typeof transaction.ticketsDownloadAvailableDate.toDate === "function"
            ? transaction.ticketsDownloadAvailableDate.toDate()
            : transaction.ticketsDownloadAvailableDate instanceof Date
              ? transaction.ticketsDownloadAvailableDate
              : transaction.ticketsDownloadAvailableDate
                ? new Date(transaction.ticketsDownloadAvailableDate)
                : undefined,
        ticketItems,
        installments,
        user,
        event,
      })
    }

    return transactions
  } catch (error) {
    console.error("Error getting paid ticket transactions:", error)
    return []
  }
}

function calculateInstallmentDates(
  startDate: Date,
  numberOfInstallments: number,
  frequency: "weekly" | "biweekly" | "monthly",
): Date[] {
  const dates: Date[] = []
  const currentDate = new Date(startDate)

  for (let i = 0; i < numberOfInstallments; i++) {
    dates.push(new Date(currentDate)) // Store a copy of the date

    switch (frequency) {
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case "biweekly":
        currentDate.setDate(currentDate.getDate() + 14)
        break
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
    }
  }

  return dates
}

// Assign tickets to user (for admin)
export async function assignTicketsToUser(
  userId: string,
  eventId: string,
  zoneId: string,
  quantity: number,
  price: number,
  isCourtesy: boolean,
  paymentType: "full" | "installment",
  numberOfInstallments?: number,
  installmentFrequency?: "weekly" | "biweekly" | "monthly",
  paymentProofUrl?: string,
  ticketsDownloadAvailableDate?: Date,
  adminId: string,
  ticketPdfUrls: string[] = [],
): Promise<void> {
  try {
    // Generate transaction ID
    const transactionId = uuidv4()

    // Get event and zone info
    const eventDoc = await getDoc(doc(db, "events", eventId))
    const event = eventDoc.data() as Event

    // Create ticket items
    const ticketItems: TicketItem[] = []
    for (let i = 0; i < quantity; i++) {
      ticketItems.push({
        id: uuidv4(),
        transactionId,
        eventId,
        zoneId,
        phaseId: "", // Not applicable for admin-assigned tickets
        price,
        currency: event.currency,
        status: "approved", // Auto-approved since admin is assigning
        isNominated: false,
        ticketPdfUrl: ticketPdfUrls[i] || "", // Asignar la URL del PDF correspondiente
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Create payment installments if applicable
    const paymentInstallments: PaymentInstallment[] = []
    if (paymentType === "installment" && numberOfInstallments && installmentFrequency) {
      const installmentAmount = (price * quantity) / numberOfInstallments
      const installmentDates = calculateInstallmentDates(new Date(), numberOfInstallments, installmentFrequency)

      installmentDates.forEach((date, index) => {
        paymentInstallments.push({
          id: uuidv4(),
          transactionId,
          installmentNumber: index + 1,
          amount: installmentAmount,
          currency: event.currency,
          dueDate: date,
          status: index === 0 ? "paid" : "pending", // First installment is paid
          adminApproved: index === 0, // First installment is approved
          approvedBy: index === 0 ? adminId : undefined,
          approvedAt: index === 0 ? new Date() : undefined,
        })
      })
    }

    // Create transaction object
    const transaction: TicketTransaction = {
      id: transactionId,
      userId,
      eventId,
      createdAt: new Date(),
      totalAmount: price * quantity,
      currency: event.currency,
      paymentMethod: "offline",
      paymentStatus: "approved", // Auto-approved since admin is assigning
      paymentType,
      offlinePaymentMethod: "transfer", // Default
      paymentProofUrl: paymentProofUrl || "",
      adminNotes: isCourtesy ? "Cortesía asignada por administrador" : "Ticket asignado por administrador",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      ticketsDownloadAvailableDate,
      ticketItems,
      isCourtesy,
      ...(paymentType === "installment" && {
        numberOfInstallments,
        installmentFrequency,
      }),
    }

    console.log("Creando transacción con tickets:", transaction)
    console.log("URLs de PDFs asignados:", ticketPdfUrls)

    // Save to Firestore
    await createTicketTransaction(transaction, paymentInstallments)
  } catch (error) {
    console.error("Error assigning tickets to user:", error)
    throw error
  }
}

// Guardar una transacción de tickets directamente en la colección ticketTransactions
export async function saveTicketTransaction(transactionData: any) {
  try {
    const db = getFirestore()
    const transactionRef = doc(db, "ticketTransactions", transactionData.id)
    await setDoc(transactionRef, transactionData)
    return transactionData.id
  } catch (error) {
    console.error("Error saving ticket transaction:", error)
    throw error
  }
}

// Actualizar una transacción de tickets existente
export async function updateTicketTransaction(
  transactionId: string,
  updateData: Partial<TicketTransaction>,
): Promise<void> {
  try {
    const transactionRef = doc(db, "ticketTransactions", transactionId)

    // Añadir timestamp de actualización
    const dataToUpdate = {
      ...updateData,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(transactionRef, dataToUpdate)

    console.log(`Transacción ${transactionId} actualizada con éxito:`, updateData)
  } catch (error) {
    console.error(`Error actualizando transacción ${transactionId}:`, error)
    throw error
  }
}
