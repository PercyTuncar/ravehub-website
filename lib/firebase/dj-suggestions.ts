import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  orderBy,
  limit,
  increment,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { DJSuggestion } from "@/types/dj-ranking"

// Get all DJ suggestions
export async function getAllDJSuggestions() {
  try {
    const suggestionsRef = collection(db, "djSuggestions")
    const q = query(suggestionsRef, orderBy("popularity", "desc"))
    const querySnapshot = await getDocs(q)

    const suggestions: DJSuggestion[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      suggestions.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as DJSuggestion)
    })

    return suggestions
  } catch (error) {
    console.error("Error getting DJ suggestions:", error)
    throw error
  }
}

// Get DJ suggestions by country
export async function getDJSuggestionsByCountry(country: string) {
  try {
    const suggestionsRef = collection(db, "djSuggestions")
    const q = query(suggestionsRef, where("country", "==", country), orderBy("popularity", "desc"))
    const querySnapshot = await getDocs(q)

    const suggestions: DJSuggestion[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      suggestions.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as DJSuggestion)
    })

    return suggestions
  } catch (error) {
    console.error("Error getting DJ suggestions by country:", error)
    throw error
  }
}

// Search DJ suggestions by name
export async function searchDJSuggestions(name: string, limitCount = 5) {
  try {
    const suggestionsRef = collection(db, "djSuggestions")
    // Firebase doesn't support native "LIKE" queries, so we'll get all and filter
    // In a production app, consider using Algolia or another search service
    const q = query(suggestionsRef, orderBy("name"), limit(100))
    const querySnapshot = await getDocs(q)

    const suggestions: DJSuggestion[] = []
    const lowerName = name.toLowerCase()

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.name.toLowerCase().includes(lowerName)) {
        suggestions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as DJSuggestion)
      }
    })

    return suggestions.slice(0, limitCount)
  } catch (error) {
    console.error("Error searching DJ suggestions:", error)
    throw error
  }
}

// Add a new DJ suggestion
export async function addDJSuggestion(
  suggestion: Omit<DJSuggestion, "id" | "popularity" | "approved" | "createdAt" | "updatedAt">,
) {
  try {
    // Check if this DJ has already been suggested with the same name and instagram
    const existingSuggestions = await searchDJSuggestions(suggestion.name)
    const existingSuggestion = existingSuggestions.find(
      (s) =>
        s.name.toLowerCase() === suggestion.name.toLowerCase() &&
        s.instagram.toLowerCase() === suggestion.instagram.toLowerCase(),
    )

    if (existingSuggestion) {
      // If the user hasn't already suggested this DJ
      if (!existingSuggestion.suggestedBy.includes(suggestion.suggestedBy[0])) {
        // Update the existing suggestion to increment popularity and add the user
        await updateDoc(doc(db, "djSuggestions", existingSuggestion.id), {
          popularity: increment(1),
          suggestedBy: [...existingSuggestion.suggestedBy, ...suggestion.suggestedBy],
          updatedAt: serverTimestamp(),
        })
        return existingSuggestion.id
      } else {
        // User already suggested this DJ
        throw new Error("You have already suggested this DJ")
      }
    } else {
      // Create a new suggestion
      const docRef = await addDoc(collection(db, "djSuggestions"), {
        ...suggestion,
        popularity: 1,
        approved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    }
  } catch (error) {
    console.error("Error adding DJ suggestion:", error)
    throw error
  }
}

// Approve a DJ suggestion and create a DJ profile
export async function approveDJSuggestion(suggestionId: string, adminId: string) {
  try {
    const suggestionRef = doc(db, "djSuggestions", suggestionId)
    const suggestionDoc = await getDoc(suggestionRef)

    if (!suggestionDoc.exists()) {
      throw new Error("DJ suggestion not found")
    }

    const suggestionData = suggestionDoc.data() as DJSuggestion

    // Create a new DJ profile
    const djRef = await addDoc(collection(db, "djs"), {
      name: suggestionData.name,
      instagram: suggestionData.instagram,
      country: suggestionData.country,
      approved: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: adminId,
    })

    // Update the suggestion to mark it as approved and link to the DJ
    await updateDoc(suggestionRef, {
      approved: true,
      djId: djRef.id,
      updatedAt: serverTimestamp(),
    })

    return djRef.id
  } catch (error) {
    console.error("Error approving DJ suggestion:", error)
    throw error
  }
}
