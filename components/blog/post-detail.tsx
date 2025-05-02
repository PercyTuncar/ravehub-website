"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, Clock, Share2, Eye, AlertCircle } from "lucide-react"
import { SocialShare } from "./social-share"
import { CommentsSection } from "./comments-section"
import { RatingSystem } from "./rating-system"
import { PostReactions } from "./post-reactions"
import { formatDate, calculateReadTime } from "@/lib/utils"
import { getCategoryById, incrementPostView } from "@/lib/firebase/blog"
import type { BlogPost } from "@/types/blog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { PostTags } from "./post-tags"

interface PostDetailProps {
  post: BlogPost
}

// Definir la interfaz para el objeto de etiqueta
interface TagObject {
  id?: string
  name: string
  slug: string
  color?: string
  // Otros campos opcionales que podrían estar presentes
  description?: string
  imageUrl?: string
  featured?: boolean
  // etc.
}

// Add a new function to extract colors from the image URL (after the existing imports)
function extractColorsFromUrl(url: string): string[] {
  if (!url) return []

  // Extract the filename from the URL
  const filename = url.split("/").pop() || ""

  // Check if the filename contains "color"
  if (!filename.toLowerCase().includes("color")) return []

  // Extract the color codes after "color"
  const colorMatch = filename.toLowerCase().match(/color-([a-f0-9-]+)/i)
  if (!colorMatch || !colorMatch[1]) return []

  // Split by hyphens and ensure each color has a # prefix
  return colorMatch[1].split("-").map((color) => (color.startsWith("#") ? color : `#${color}`))
}

// Add a function to generate the title style based on extracted colors (after the extractColorsFromUrl function)
function generateTitleStyle(colors: string[]): React.CSSProperties {
  if (!colors.length) return {}

  if (colors.length === 1) {
    // Single color - apply directly to text
    return { color: colors[0] }
  } else {
    // Multiple colors - create gradient
    const gradient = `linear-gradient(to right, ${colors.join(", ")})`
    return {
      background: gradient,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      display: "inline-block",
    }
  }
}

export function PostDetail({ post }: PostDetailProps) {
  const { user } = useAuth()
  const [imageUrl, setImageUrl] = useState(
    post.mainImageUrl || post.featuredImageUrl || "/placeholder.svg?height=600&width=1200",
  )
  const [imageAlt, setImageAlt] = useState(
    post.imageAltTexts && post.imageAltTexts[post.mainImageUrl || post.featuredImageUrl || ""]
      ? post.imageAltTexts[post.mainImageUrl || post.featuredImageUrl || ""]
      : `${post.title} - Imagen principal`,
  )
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [readTime, setReadTime] = useState(post.readTime || calculateReadTime(post.content))
  const [averageRating, setAverageRating] = useState(post.averageRating || 0)
  const [ratingCount, setRatingCount] = useState(post.ratingCount || 0)

  const extractedColors = useMemo(
    () => extractColorsFromUrl(post.featuredImageUrl || post.mainImageUrl || ""),
    [post.featuredImageUrl, post.mainImageUrl],
  )

  const titleStyle = useMemo(() => generateTitleStyle(extractedColors), [extractedColors])

  // Función auxiliar para determinar si un tag es un objeto y extraer sus propiedades
  const processTag = (tag: string | TagObject) => {
    const isObject = typeof tag !== "string"
    return {
      name: isObject ? (tag as TagObject).name : tag,
      slug: isObject ? (tag as TagObject).slug : (tag as string).toLowerCase().replace(/\s+/g, "-"),
      color: isObject ? (tag as TagObject).color : undefined,
    }
  }

  useEffect(() => {
    if (post.categoryId) {
      loadCategory()
    }

    // Increment view count
    incrementPostView(post.id)
  }, [post.categoryId, post.id])

  const loadCategory = async () => {
    try {
      const category = await getCategoryById(post.categoryId)
      if (category) {
        setCategoryName(category.name)
      }
    } catch (error) {
      console.error("Error loading category:", error)
    }
  }

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions)
  }

  const handleRatingChange = (newRating: number, newCount: number) => {
    setAverageRating(newRating)
    setRatingCount(newCount)
  }

  const formattedPublishDate = formatDate(post.publishDate)
  const formattedEventDate = post.eventDate ? formatDate(post.eventDate) : null

  const renderContent = () => {
    if (!post.content) return null

    // Check if the post has a contentFormat property, or infer from content
    const isHtmlContent = post.contentFormat === "html" || (post.content.includes("<") && post.content.includes(">"))

    if (isHtmlContent) {
      // If content is HTML, render it directly with dangerouslySetInnerHTML
      return (
        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )
    } else {
      // If content is Markdown, render with ReactMarkdown
      return (
        <ReactMarkdown
          className="prose prose-lg max-w-none dark:prose-invert"
          rehypePlugins={[rehypeRaw]} // Allow HTML in markdown
          remarkPlugins={[remarkGfm]} // GitHub Flavored Markdown
          components={{
            // Headings with proper spacing and anchors
            h1: ({ node, ...props }) => (
              <h1
                id={props.children.toString().toLowerCase().replace(/\s+/g, "-")}
                className="scroll-mt-20 text-3xl font-bold mt-8 mb-4"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                id={props.children.toString().toLowerCase().replace(/\s+/g, "-")}
                className="scroll-mt-20 text-2xl font-bold mt-8 mb-4"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                id={props.children.toString().toLowerCase().replace(/\s+/g, "-")}
                className="scroll-mt-20 text-xl font-bold mt-6 mb-3"
                {...props}
              />
            ),
            h4: ({ node, ...props }) => (
              <h4
                id={props.children.toString().toLowerCase().replace(/\s+/g, "-")}
                className="scroll-mt-20 text-lg font-bold mt-6 mb-3"
                {...props}
              />
            ),

            // Paragraphs with proper spacing
            p: ({ node, ...props }) => <p className="my-4 leading-relaxed" {...props} />,

            // Lists with proper spacing and bullets
            ul: ({ node, ...props }) => <ul className="my-6 list-disc pl-6 space-y-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="my-6 list-decimal pl-6 space-y-2" {...props} />,
            li: ({ node, ...props }) => <li className="pl-2" {...props} />,

            // Blockquotes with styling
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-primary/30 pl-4 italic my-6 text-muted-foreground" {...props} />
            ),

            // Links with proper styling
            a: ({ node, ...props }) => (
              <a
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                {...props}
              />
            ),

            // Tables with proper styling
            table: ({ node, ...props }) => (
              <div className="my-6 w-full overflow-x-auto">
                <table className="w-full border-collapse" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
            th: ({ node, ...props }) => <th className="border px-4 py-2 text-left font-semibold" {...props} />,
            td: ({ node, ...props }) => <td className="border px-4 py-2" {...props} />,

            // Code blocks with syntax highlighting
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "")
              const lang = match && match[1] ? match[1].toLowerCase() : ""

              // Ensure proper language mapping for HTML, CSS and JS
              const languageMap: Record<string, string> = {
                js: "javascript",
                jsx: "jsx",
                ts: "typescript",
                tsx: "tsx",
                html: "html",
                css: "css",
                scss: "scss",
                sass: "sass",
                less: "less",
              }

              const mappedLang = languageMap[lang] || lang

              return !inline && match ? (
                <div className="my-6 rounded-md overflow-hidden">
                  <div className="bg-zinc-800 text-zinc-200 px-4 py-1.5 text-xs font-mono flex justify-between items-center">
                    <span>{mappedLang.toUpperCase()}</span>
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={mappedLang}
                    PreTag="div"
                    className="text-sm"
                    showLineNumbers
                    wrapLines
                    wrapLongLines={false}
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            },

            // Images with proper styling
            img({ node, ...props }) {
              return (
                <div className="my-6">
                  <img className="rounded-md mx-auto max-h-[600px] object-contain" loading="lazy" {...props} />
                  {props.alt && props.alt !== props.src && (
                    <p className="text-center text-sm text-muted-foreground mt-2">{props.alt}</p>
                  )}
                </div>
              )
            },

            // Horizontal rule
            hr: ({ node, ...props }) => <hr className="my-8 border-muted" {...props} />,

            // Strong and emphasis
            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
            em: ({ node, ...props }) => <em className="italic" {...props} />,
          }}
        >
          {post.content}
        </ReactMarkdown>
      )
    }
  }

  // Extract headings for table of contents
  const extractHeadings = () => {
    if (!post.content) return []

    // Check if the post has a contentFormat property, or infer from content
    const isHtmlContent = post.contentFormat === "html" || (post.content.includes("<") && post.content.includes(">"))

    if (isHtmlContent) {
      // Extract headings from HTML content
      const htmlHeadingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/g
      const headings = []
      let htmlMatch

      while ((htmlMatch = htmlHeadingRegex.exec(post.content)) !== null) {
        const level = Number.parseInt(htmlMatch[1])
        const text = htmlMatch[2].replace(/<[^>]*>/g, "") // Remove any HTML tags inside heading
        const id = text
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "")

        headings.push({
          level,
          text,
          id,
        })
      }

      return headings
    } else {
      // Extract headings from markdown content
      const headingRegex = /^(#{2,3})\s+(.+)$/gm
      const headings = []
      let match

      const content = post.content
      const lines = content.split("\n")

      for (const line of lines) {
        match = headingRegex.exec(line)
        if (match) {
          const level = match[1].length
          const text = match[2].trim()
          const id = text
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "")

          headings.push({
            level,
            text,
            id,
          })
        }
      }

      return headings
    }
  }

  const renderFAQ = () => {
    if (!post.faq || post.faq.length === 0) return null

    // Check if the post has a contentFormat property, or infer from content
    const isHtmlContent = post.contentFormat === "html" || (post.content.includes("<") && post.content.includes(">"))

    return (
      <div className="mt-8 bg-muted/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Preguntas frecuentes</h3>
        <Accordion type="single" collapsible className="w-full">
          {post.faq.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium text-lg py-4">{item.question}</AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 pb-4 text-muted-foreground">
                  {isHtmlContent ? (
                    <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                  ) : (
                    <ReactMarkdown
                      className="prose prose-sm max-w-none dark:prose-invert"
                      rehypePlugins={[rehypeRaw]}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="my-2 leading-relaxed" {...props} />,
                        ul: ({ node, ...props }) => <ul className="my-3 list-disc pl-5 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="my-3 list-decimal pl-5 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                        a: ({ node, ...props }) => (
                          <a
                            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                            {...props}
                          />
                        ),
                        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                        code: ({ node, inline, ...props }) =>
                          inline ? (
                            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />
                          ) : (
                            <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs my-2" {...props} />
                          ),
                      }}
                    >
                      {item.answer}
                    </ReactMarkdown>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    )
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {categoryName && (
            <Badge variant="outline" className="bg-primary/10">
              <Link href={`/blog/categorias/${post.categoryId}`}>{categoryName}</Link>
            </Badge>
          )}

          {post.tags &&
            post.tags.map((tag, index) => {
              const { name, slug, color } = processTag(tag)

              return (
                <Badge key={index} variant="secondary">
                  <Link href={`/blog/etiquetas/${slug}`} className="flex items-center gap-1.5">
                    {color && (
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                    )}
                    #{name}
                  </Link>
                </Badge>
              )
            })}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={titleStyle}>
          {post.title}
        </h1>

        <div className="text-muted-foreground mb-4">{post.shortDescription || post.excerpt}</div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5" />
            <time dateTime={new Date(post.publishDate).toISOString()}>{formattedPublishDate}</time>
          </div>

          {post.eventDate && (
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-1.5" />
              <span>Evento: {formattedEventDate}</span>
            </div>
          )}

          {post.location && post.location.city && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1.5" />
              <span>
                {post.location.city}, {post.location.country}
              </span>
              {post.location.venueName && <span> ({post.location.venueName})</span>}
            </div>
          )}

          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1.5" />
            <span>{readTime} min de lectura</span>
          </div>

          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1.5" />
            <span>{post.viewCount || 0} vistas</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorImageUrl || ""} alt={post.author} />
              <AvatarFallback>{post.author ? post.author.charAt(0) : "A"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{post.author}</div>
              <div className="text-sm text-muted-foreground">Autor</div>
            </div>
          </div>

          <div className="self-start sm:self-center">
            <RatingSystem
              postId={post.id}
              initialRating={averageRating}
              initialCount={ratingCount}
              onRatingChange={handleRatingChange}
            />
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="relative aspect-video w-full mb-8 rounded-lg overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          onError={() => setImageUrl("/placeholder.svg?height=600&width=1200")}
        />
      </div>

      {/* Sistema de reacciones */}
      <PostReactions postId={post.id} />

      <Separator className="my-4" />

      {/* Content with Table of Contents */}
      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="w-full">
          {renderContent()}

          <PostTags tags={post.tags || []} />

          {/* Video Embed */}
          {post.videoEmbedUrl && (
            <div className="my-8">
              <div className="relative aspect-video w-full">
                <iframe
                  src={post.videoEmbedUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  allowFullScreen
                  title="Video embed"
                />
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {renderFAQ()}

          {/* Image Gallery */}
          {post.imageGallery && post.imageGallery.length > 0 && (
            <div className="my-8">
              <h3 className="text-xl font-semibold mb-4">Galería de imágenes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {post.imageGallery.map((imageUrl, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={
                        post.imageAltTexts && post.imageAltTexts[imageUrl]
                          ? post.imageAltTexts[imageUrl]
                          : `${post.title} - Imagen ${index + 1}`
                      }
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Event CTA */}
          {post.relatedEventId && (
            <Alert className="my-8 bg-primary/10">
              <AlertDescription>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <p className="font-medium">¿Interesado en asistir a este evento?</p>
                    <p>Revisa todos los detalles y entradas disponibles.</p>
                  </div>
                  <Button asChild>
                    <Link href={`/eventos/${post.relatedEventId}`}>Ver evento</Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Tags & Share */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {post.tags &&
            post.tags.map((tag, index) => {
              const { name, slug, color } = processTag(tag)

              return (
                <Badge key={index} variant="outline">
                  <Link href={`/blog/etiquetas/${slug}`} className="flex items-center gap-1.5">
                    {color && (
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                    )}
                    #{name}
                  </Link>
                </Badge>
              )
            })}
        </div>

        <div className="relative">
          <Button variant="outline" size="sm" onClick={toggleShareOptions} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Compartir
          </Button>

          {showShareOptions && (
            <div className="absolute right-0 top-full mt-2 z-50">
              <SocialShare
                url={typeof window !== "undefined" ? window.location.href : ""}
                title={post.title}
                description={post.shortDescription || post.excerpt || ""}
                onClose={() => setShowShareOptions(false)}
              />
            </div>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Comments */}
      <CommentsSection postId={post.id} />
    </article>
  )
}
