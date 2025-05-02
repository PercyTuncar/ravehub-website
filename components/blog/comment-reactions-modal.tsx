"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { getUsersByCommentReactionType } from "@/lib/firebase/blog"

// Define reaction types
type CommentReactionType =
  | "hot"
  | "crazy"
  | "people"
  | "excited"
  | "scream"
  | "ono"
  | "like"
  | "heart"
  | "funny"
  | "surprise"
  | "sad"
  | "angry"

interface CommentReaction {
  id: string
  commentId: string
  userId: string
  userName: string
  userImageUrl?: string
  reactionType: CommentReactionType
  createdAt: Date
}

interface ReactionInfo {
  emoji: string
  label: string
}

// Map reaction types to emojis and labels
const reactionInfo: Record<CommentReactionType, ReactionInfo> = {
  hot: { emoji: "🥵", label: "Me calienta" },
  crazy: { emoji: "🤪", label: "Me aloca" },
  people: { emoji: "👌", label: "¡Somos, Gente!" },
  excited: { emoji: "😈", label: "Me excita" },
  scream: { emoji: "🌈", label: "Me hace gritar ¡Aaaahhh!" },
  ono: { emoji: "🌸", label: "Oño" },
  like: { emoji: "👍", label: "Me gusta" },
  heart: { emoji: "❤️", label: "Me encanta" },
  funny: { emoji: "😂", label: "Me divierte" },
  surprise: { emoji: "😮", label: "Me sorprende" },
  sad: { emoji: "😢", label: "Me entristece" },
  angry: { emoji: "😡", label: "Me enoja" },
}

interface CommentReactionsSummary {
  total: number
  types: Record<CommentReactionType, number>
  topReactions: CommentReactionType[]
}

interface CommentReactionsModalProps {
  commentId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  reactionsSummary: CommentReactionsSummary
}

export function CommentReactionsModal({
  commentId,
  isOpen,
  onOpenChange,
  reactionsSummary,
}: CommentReactionsModalProps) {
  const [selectedTab, setSelectedTab] = useState<CommentReactionType | "all">("all")
  const [reactionUsers, setReactionUsers] = useState<CommentReaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load users who reacted when modal opens
  useEffect(() => {
    if (isOpen) {
      loadReactionUsers(selectedTab)
    }
  }, [isOpen, commentId, selectedTab])

  // Load users who reacted with a specific type
  const loadReactionUsers = async (type: CommentReactionType | "all") => {
    try {
      setIsLoading(true)

      if (type === "all") {
        // For "all", we need to get all reactions
        const allReactions: CommentReaction[] = []

        // Get reactions for each type that has at least one reaction
        for (const reactionType of Object.keys(reactionsSummary.types) as CommentReactionType[]) {
          if (reactionsSummary.types[reactionType] > 0) {
            const typeReactions = await getUsersByCommentReactionType(commentId, reactionType)
            allReactions.push(...typeReactions)
          }
        }

        // Sort by date (most recent first)
        allReactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setReactionUsers(allReactions)
      } else {
        const users = await getUsersByCommentReactionType(commentId, type)
        setReactionUsers(users)
      }
    } catch (error) {
      console.error(`Error loading users for reaction type ${type}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value as CommentReactionType | "all")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reacciones</DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">Todas ({reactionsSummary.total})</TabsTrigger>
            {reactionsSummary.topReactions.slice(0, 3).map((type) => (
              <TabsTrigger key={type} value={type}>
                <span className="mr-1">{reactionInfo[type].emoji}</span>
                <span>{reactionsSummary.types[type] || 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedTab} className="mt-0">
            <ScrollArea className="h-[300px] pr-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reactionUsers.length > 0 ? (
                <div className="space-y-4">
                  {reactionUsers.map((reaction) => (
                    <div key={reaction.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reaction.userImageUrl || ""} alt={reaction.userName} />
                        <AvatarFallback>{reaction.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{reaction.userName}</div>
                      </div>
                      <div className="text-xl" title={reactionInfo[reaction.reactionType].label}>
                        {reactionInfo[reaction.reactionType].emoji}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No hay reacciones aún</div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
