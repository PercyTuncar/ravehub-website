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
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface Country {
  id: string
  name: string
  code: string // ISO 3166-1 alpha-2
  region: string // Continent or region
  flag: string // Flag emoji
  createdAt: Date
  updatedAt: Date
}

// Get all countries
export async function getAllCountries(): Promise<Country[]> {
  try {
    const countriesRef = collection(db, "countries")
    const q = query(countriesRef, orderBy("name"))
    const querySnapshot = await getDocs(q)

    const countries: Country[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      countries.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Country)
    })

    return countries
  } catch (error) {
    console.error("Error getting countries:", error)
    throw error
  }
}

// Get country by ID
export async function getCountryById(id: string): Promise<Country | null> {
  try {
    const docRef = doc(db, "countries", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Country
    }
    return null
  } catch (error) {
    console.error("Error getting country by ID:", error)
    throw error
  }
}

// Search countries by name
export async function searchCountries(name: string, limitCount = 10): Promise<Country[]> {
  try {
    const countriesRef = collection(db, "countries")
    const q = query(countriesRef, orderBy("name"), limit(200))
    const querySnapshot = await getDocs(q)

    const countries: Country[] = []
    const lowerName = name.toLowerCase()

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.name.toLowerCase().includes(lowerName)) {
        countries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Country)
      }
    })

    return countries.slice(0, limitCount)
  } catch (error) {
    console.error("Error searching countries:", error)
    throw error
  }
}

// Create new country
export async function createCountry(countryData: Omit<Country, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "countries"), {
      ...countryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating country:", error)
    throw error
  }
}

// Update country
export async function updateCountry(id: string, data: Partial<Country>): Promise<void> {
  try {
    const countryRef = doc(db, "countries", id)
    await updateDoc(countryRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating country:", error)
    throw error
  }
}

// Get countries by region
export async function getCountriesByRegion(region: string): Promise<Country[]> {
  try {
    const countriesRef = collection(db, "countries")
    const q = query(countriesRef, where("region", "==", region), orderBy("name"))
    const querySnapshot = await getDocs(q)

    const countries: Country[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      countries.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Country)
    })

    return countries
  } catch (error) {
    console.error("Error getting countries by region:", error)
    throw error
  }
}