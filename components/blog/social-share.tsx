"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Facebook, Twitter, Linkedin, Mail, Copy, X, Share } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SocialShareProps {
  url: string
  title: string
  description?: string
  onClose?: () => void
}

export function SocialShare({ url, title, description, onClose }: SocialShareProps) {
  const { toast } = useToast()

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = description ? encodeURIComponent(description) : ""

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace ha sido copiado al portapapeles",
      })
      if (onClose) onClose()
    })
  }

  return (
    <Card className="w-[260px]">
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <Share className="h-4 w-4" />
            <span className="text-sm font-medium">Compartir</span>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0.5" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2">
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1"
          >
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
              <Facebook className="h-4 w-4" />
            </Button>
            <span className="text-xs">Facebook</span>
          </a>

          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1"
          >
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
              <Twitter className="h-4 w-4" />
            </Button>
            <span className="text-xs">Twitter</span>
          </a>

          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1"
          >
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
              <Linkedin className="h-4 w-4" />
            </Button>
            <span className="text-xs">LinkedIn</span>
          </a>

          <a
            href={shareLinks.email}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1"
          >
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
              <Mail className="h-4 w-4" />
            </Button>
            <span className="text-xs">Email</span>
          </a>

          <button onClick={handleCopyLink} className="flex flex-col items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
              <Copy className="h-4 w-4" />
            </Button>
            <span className="text-xs">Copiar</span>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
