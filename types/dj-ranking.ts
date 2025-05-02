export interface DJ {
  id: string
  name: string
  instagram: string
  country: string
  genres?: string[]
  bio?: string
  photoUrl?: string
  socialLinks?: {
    facebook?: string
    twitter?: string
    soundcloud?: string
    spotify?: string
    website?: string
    [key: string]: string | undefined
  }
  approved: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy?: string
}

export interface DJSuggestion {
  id: string
  djId?: string // If it's linked to an existing DJ
  name: string
  instagram: string
  country: string
  popularity: number
  suggestedBy: string[] // Array of userIds who suggested this DJ
  approved: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Vote {
  id: string
  userId: string
  country: string
  year: number
  votes: string[] // Array of djIds (max 5)
  createdAt: Date
  updatedAt: Date
}

export interface VotingPeriod {
  id: string
  country: string
  year: number
  suggestionsOpen: boolean
  votingOpen: boolean
  resultsPublished: boolean
  topCount: number // How many DJs to show in the ranking (10, 50, 100)
  createdAt: Date
  updatedAt: Date
}

export interface Ranking {
  id: string
  country: string
  year: number
  djs: RankedDJ[]
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface RankedDJ {
  djId: string
  position: number
  voteCount: number
  name: string
  instagram: string
  photoUrl?: string
}
