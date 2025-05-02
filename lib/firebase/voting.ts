import { collection, query, where, getDocs, doc, addDoc, updateDoc, orderBy, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Vote, VotingPeriod, Ranking, RankedDJ } from "@/types/dj-ranking"
import { getDJById } from "@/lib/firebase/dj"

// Get active voting periods
export async function getActiveVotingPeriods() {
  try {
    const periodsRef = collection(db, "votingPeriods")
    const q = query(periodsRef, where("votingOpen", "==", true), orderBy("year", "desc"))
    const querySnapshot = await getDocs(q)

    const periods: VotingPeriod[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      periods.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as VotingPeriod)
    })

    return periods
  } catch (error) {
    console.error("Error getting active voting periods:", error)
    throw error
  }
}

// Get voting period by country and year
export async function getVotingPeriod(country: string, year: number) {
  try {
    const periodsRef = collection(db, "votingPeriods")
    const q = query(periodsRef, where("country", "==", country), where("year", "==", year))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as VotingPeriod
  } catch (error) {
    console.error("Error getting voting period:", error)
    throw error
  }
}

// Create or update voting period
export async function createOrUpdateVotingPeriod(period: Omit<VotingPeriod, "id" | "createdAt" | "updatedAt">) {
  try {
    const periodsRef = collection(db, "votingPeriods")
    const q = query(periodsRef, where("country", "==", period.country), where("year", "==", period.year))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Create new period
      const docRef = await addDoc(collection(db, "votingPeriods"), {
        ...period,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    } else {
      // Update existing period
      const docRef = querySnapshot.docs[0].ref
      await updateDoc(docRef, {
        ...period,
        updatedAt: serverTimestamp(),
      })
      return querySnapshot.docs[0].id
    }
  } catch (error) {
    console.error("Error creating/updating voting period:", error)
    throw error
  }
}

// Get user votes for a specific country and year
export async function getUserVotes(userId: string, country: string, year: number) {
  try {
    const votesRef = collection(db, "votes")
    const q = query(votesRef, where("userId", "==", userId), where("country", "==", country), where("year", "==", year))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Vote
  } catch (error) {
    console.error("Error getting user votes:", error)
    throw error
  }
}

// Submit votes
export async function submitVotes(vote: Omit<Vote, "id" | "createdAt" | "updatedAt">) {
  try {
    // Check if user already voted for this country/year
    const existingVote = await getUserVotes(vote.userId, vote.country, vote.year)

    if (existingVote) {
      throw new Error("You have already voted for this country and year")
    }

    // Check if voting is open
    const votingPeriod = await getVotingPeriod(vote.country, vote.year)

    if (!votingPeriod || !votingPeriod.votingOpen) {
      throw new Error("Voting is not currently open for this country and year")
    }

    // Check if votes array has max 5 DJs
    if (vote.votes.length > 5) {
      throw new Error("You can only vote for up to 5 DJs")
    }

    // Submit votes
    const docRef = await addDoc(collection(db, "votes"), {
      ...vote,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error submitting votes:", error)
    throw error
  }
}

// Count votes and generate ranking
export async function generateRanking(country: string, year: number) {
  try {
    // Check if voting period exists and is closed
    const votingPeriod = await getVotingPeriod(country, year)

    if (!votingPeriod) {
      throw new Error("Voting period not found")
    }

    if (votingPeriod.votingOpen) {
      throw new Error("Voting is still open, cannot generate ranking yet")
    }

    // Get all votes for this country and year
    const votesRef = collection(db, "votes")
    const q = query(votesRef, where("country", "==", country), where("year", "==", year))
    const querySnapshot = await getDocs(q)

    // Count votes for each DJ
    const voteCount: Record<string, number> = {}

    querySnapshot.forEach((doc) => {
      const vote = doc.data() as Vote
      vote.votes.forEach((djId) => {
        voteCount[djId] = (voteCount[djId] || 0) + 1
      })
    })

    // Sort DJs by vote count
    const sortedDJs = Object.entries(voteCount)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, votingPeriod.topCount)

    // Create ranked DJ objects
    const rankedDJs: RankedDJ[] = []

    for (let i = 0; i < sortedDJs.length; i++) {
      const [djId, count] = sortedDJs[i]
      const dj = await getDJById(djId)

      if (dj) {
        rankedDJs.push({
          djId,
          position: i + 1,
          voteCount: count,
          name: dj.name,
          instagram: dj.instagram,
          photoUrl: dj.photoUrl,
        })
      }
    }

    // Create or update ranking
    const rankingsRef = collection(db, "rankings")
    const rankingQuery = query(rankingsRef, where("country", "==", country), where("year", "==", year))
    const rankingSnapshot = await getDocs(rankingQuery)

    if (rankingSnapshot.empty) {
      // Create new ranking
      await addDoc(collection(db, "rankings"), {
        country,
        year,
        djs: rankedDJs,
        publishedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } else {
      // Update existing ranking
      const rankingRef = rankingSnapshot.docs[0].ref
      await updateDoc(rankingRef, {
        djs: rankedDJs,
        updatedAt: serverTimestamp(),
      })
    }

    // Update voting period to indicate results are ready
    await updateDoc(doc(db, "votingPeriods", votingPeriod.id), {
      resultsPublished: true,
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error generating ranking:", error)
    throw error
  }
}

// Get ranking by country and year
export async function getRanking(country: string, year: number) {
  try {
    const rankingsRef = collection(db, "rankings")
    const q = query(rankingsRef, where("country", "==", country), where("year", "==", year))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      publishedAt: data.publishedAt?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Ranking
  } catch (error) {
    console.error("Error getting ranking:", error)
    throw error
  }
}

// Publish ranking
export async function publishRanking(country: string, year: number) {
  try {
    const rankingsRef = collection(db, "rankings")
    const q = query(rankingsRef, where("country", "==", country), where("year", "==", year))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      throw new Error("Ranking not found")
    }

    const rankingRef = querySnapshot.docs[0].ref
    await updateDoc(rankingRef, {
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error publishing ranking:", error)
    throw error
  }
}
