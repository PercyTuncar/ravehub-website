"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import PasswordEntry from "./components/password-entry"
import PostSelector from "./components/post-selector"
import RaffleSystem from "./components/raffle-system"
import WinnerDisplay from "./components/winner-display"
import NonWinnerDisplay from "./components/non-winner-display"
import type { BlogPost, BlogComment } from "@/types/blog"
import { getAllPosts, getComments } from "@/lib/firebase/blog"
import { getUserById } from "@/lib/firebase/users"
import Script from "next/script"

export default function SorteoClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [comments, setComments] = useState<BlogComment[]>([])
  const [winners, setWinners] = useState<
    {
      name: string
      email: string
      commentContent: string
      date: Date | null
      userId: string
      userImageUrl: string
    }[]
  >([])
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [attemptOption, setAttemptOption] = useState<"first" | "second" | "third">("first")
  const [isRaffling, setIsRaffling] = useState(false)
  const [showFinalWinner, setShowFinalWinner] = useState(false)
  const [usedUserIds, setUsedUserIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isAuthenticated) {
      loadPosts()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (selectedPost) {
      loadComments()
    }
  }, [selectedPost])

  const loadPosts = async () => {
    setIsLoading(true)
    try {
      const result = await getAllPosts(1, 100)
      setPosts(result.posts)
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadComments = async () => {
    if (!selectedPost) return

    setIsLoading(true)
    try {
      const commentsData = await getComments(selectedPost.id)

      // Enrich comments with user data
      const enrichedComments = await Promise.all(
        commentsData.map(async (comment) => {
          if (comment.userId) {
            try {
              const userData = await getUserById(comment.userId)
              if (userData) {
                return {
                  ...comment,
                  userEmail: userData.email || "",
                  userFirstName: userData.firstName || "",
                  userLastName: userData.lastName || "",
                  userPhone: userData.phone || "",
                  userCountry: userData.country || "",
                }
              }
            } catch (error) {
              console.error(`Error fetching user data for ${comment.userId}:`, error)
            }
          }
          return comment
        }),
      )

      setComments(enrichedComments)
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartRaffle = () => {
    if (comments.length === 0) return

    setIsRaffling(true)
    setWinners([])
    setCurrentWinnerIndex(0)
    setShowFinalWinner(false)
    setUsedUserIds(new Set())

    // Simulate raffle animation
    setTimeout(() => {
      // Get all valid comments (filter out any that might be incomplete)
      const validComments = comments.filter((comment) => comment.userId && comment.userId.trim() !== "")

      if (validComments.length === 0) {
        setIsRaffling(false)
        return
      }

      // Random selection process with uniqueness guarantee
      const selectedWinners: Array<{
        name: string
        email: string
        commentContent: string
        date: Date | null
        userId: string
        userImageUrl: string
      }> = []

      const usedIds = new Set<string>()

      // Select up to 3 winners or as many as possible
      for (let i = 0; i < 3 && i < validComments.length; i++) {
        // Filter out comments from users we've already selected
        const remainingComments = validComments.filter((comment) => !usedIds.has(comment.userId || ""))

        // If no more unique users, break
        if (remainingComments.length === 0) break

        // Select random comment from remaining ones
        const randomIndex = Math.floor(Math.random() * remainingComments.length)
        const selectedComment = remainingComments[randomIndex]

        // Add user to used set
        if (selectedComment.userId) {
          usedIds.add(selectedComment.userId)
        }

        // Add winner to our selected winners
        selectedWinners.push({
          name:
            selectedComment.userName ||
            `${selectedComment.userFirstName || ""} ${selectedComment.userLastName || ""}`.trim() ||
            "Anónimo",
          email: selectedComment.userEmail || "No disponible",
          commentContent: selectedComment.content || "Sin comentario",
          date: selectedComment.createdAt || null,
          userId: selectedComment.userId || "",
          userImageUrl: selectedComment.userImageUrl || "",
        })
      }

      setWinners(selectedWinners)
      setIsRaffling(false)

      // If "first" is selected, show the winner immediately
      if (attemptOption === "first") {
        setShowFinalWinner(true)
      }
    }, 3000)
  }

  const handleNextWinner = () => {
    if (currentWinnerIndex < getMaxIndex() - 1) {
      setCurrentWinnerIndex((prev) => prev + 1)
    } else {
      setShowFinalWinner(true)
    }
  }

  const getMaxIndex = () => {
    switch (attemptOption) {
      case "first":
        return 0
      case "second":
        return 1
      case "third":
        return 2
      default:
        return 0
    }
  }

  const getCurrentWinner = () => {
    if (winners.length === 0) return null

    if (showFinalWinner) {
      const winnerIndex = getMaxIndex()
      return winners[winnerIndex >= winners.length ? winners.length - 1 : winnerIndex]
    }

    return winners[currentWinnerIndex]
  }

  const isCurrentWinnerFinal = () => {
    return showFinalWinner || currentWinnerIndex === getMaxIndex()
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <PasswordEntry onAuthenticate={() => setIsAuthenticated(true)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      {/* Add canvas-confetti script */}
      <Script
        src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"
        strategy="beforeInteractive"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 text-center mb-8">
          Sistema de Sorteo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <PostSelector
              posts={posts}
              selectedPost={selectedPost}
              onSelectPost={setSelectedPost}
              isLoading={isLoading}
            />

            {selectedPost && comments.length > 0 && (
              <RaffleSystem
                commentCount={comments.length}
                attemptOption={attemptOption}
                onAttemptChange={setAttemptOption}
                onStartRaffle={handleStartRaffle}
                isRaffling={isRaffling}
              />
            )}
          </div>

          <AnimatePresence mode="wait">
            {winners.length > 0 && !isRaffling && (
              <motion.div
                key={`winner-${currentWinnerIndex}-${showFinalWinner}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              >
                {isCurrentWinnerFinal() ? (
                  <WinnerDisplay winner={getCurrentWinner()} />
                ) : (
                  <NonWinnerDisplay
                    nonWinner={getCurrentWinner()}
                    position={currentWinnerIndex + 1}
                    onNext={handleNextWinner}
                  />
                )}
              </motion.div>
            )}

            {isRaffling && (
              <motion.div
                key="raffling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 h-full flex items-center justify-center shadow-xl border border-indigo-100"
              >
                <div className="text-center">
                  <div className="relative w-40 h-40 mx-auto mb-6">
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 2,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-full border-t-4 border-b-4 border-purple-500"
                    />
                    <motion.div
                      animate={{
                        rotate: [360, 0],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 2.5,
                        ease: "easeInOut",
                        delay: 0.2,
                      }}
                      className="absolute inset-2 rounded-full border-l-4 border-r-4 border-pink-500"
                    />
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 3,
                        ease: "easeInOut",
                        delay: 0.4,
                      }}
                      className="absolute inset-4 rounded-full border-t-4 border-b-4 border-indigo-500"
                    />
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 2,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-10 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 shadow-lg shadow-purple-200"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
                    Seleccionando ganador...
                  </h3>
                  <p className="text-gray-600">¡La suerte está echada!</p>

                  <motion.div
                    className="mt-6 text-sm text-indigo-600"
                    animate={{
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.5,
                    }}
                  >
                    Procesando {comments.length} participantes...
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
