"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, Link, Bold, Italic, List, Heading1, Heading2, Heading3, Code, Quote } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { marked } from "marked"

interface EditorProps {
  initialContent: string
  onChange: (content: string) => void
  onImageUpload: (file: File) => Promise<string>
  mode?: "markdown" | "html"
  onModeChange?: (mode: "markdown" | "html") => void
}

export function Editor({ initialContent, onChange, onImageUpload, mode: externalMode, onModeChange }: EditorProps) {
  const [content, setContent] = useState(initialContent || "")
  const [mode, setInternalMode] = useState<"markdown" | "html">(externalMode || "markdown")
  const [previewContent, setPreviewContent] = useState("")

  // Function to update mode both internally and externally
  const setMode = (newMode: "markdown" | "html") => {
    setInternalMode(newMode)
    if (onModeChange) {
      onModeChange(newMode)
    }
  }

  // Sync with external mode changes
  useEffect(() => {
    if (externalMode && externalMode !== mode) {
      setInternalMode(externalMode)
    }
  }, [externalMode])

  // Convertir Markdown a HTML para la vista previa
  const updatePreview = (text: string) => {
    try {
      if (mode === "markdown") {
        setPreviewContent(marked.parse(text))
      } else {
        setPreviewContent(text)
      }
    } catch (error) {
      console.error("Error parsing content:", error)
      setPreviewContent("<p>Error al procesar el contenido</p>")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    onChange(newContent)
    updatePreview(newContent)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const imageUrl = await onImageUpload(e.target.files[0])
        let imageMarkdown = ""

        if (mode === "markdown") {
          imageMarkdown = `![Imagen](${imageUrl})`
        } else {
          imageMarkdown = `<img src="${imageUrl}" alt="Imagen" />`
        }

        const newContent = content + "\n" + imageMarkdown
        setContent(newContent)
        onChange(newContent)
        updatePreview(newContent)
      } catch (error) {
        console.error("Error uploading image:", error)
      }
    }
  }

  const insertText = (before: string, after = "") => {
    const textarea = document.querySelector("textarea")
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end)

    setContent(newText)
    onChange(newText)
    updatePreview(newText)

    // Restaurar el foco y la selección
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const insertMarkdown = (type: string) => {
    switch (type) {
      case "bold":
        insertText(mode === "markdown" ? "**" : "<strong>", mode === "markdown" ? "**" : "</strong>")
        break
      case "italic":
        insertText(mode === "markdown" ? "*" : "<em>", mode === "markdown" ? "*" : "</em>")
        break
      case "heading1":
        insertText(mode === "markdown" ? "# " : "<h1>", mode === "markdown" ? "" : "</h1>")
        break
      case "heading2":
        insertText(mode === "markdown" ? "## " : "<h2>", mode === "markdown" ? "" : "</h2>")
        break
      case "heading3":
        insertText(mode === "markdown" ? "### " : "<h3>", mode === "markdown" ? "" : "</h3>")
        break
      case "list":
        insertText(mode === "markdown" ? "- " : "<ul>\n  <li>", mode === "markdown" ? "" : "</li>\n</ul>")
        break
      case "code":
        insertText(mode === "markdown" ? "```\n" : "<pre><code>", mode === "markdown" ? "\n```" : "</code></pre>")
        break
      case "quote":
        insertText(mode === "markdown" ? "> " : "<blockquote>", mode === "markdown" ? "" : "</blockquote>")
        break
      case "link":
        const url = prompt("Introduce la URL:")
        const text = prompt("Introduce el texto del enlace:")
        if (url && text) {
          if (mode === "markdown") {
            insertText(`[${text}](${url})`)
          } else {
            insertText(`<a href="${url}">${text}</a>`)
          }
        }
        break
    }
  }

  // Inicializar la vista previa al cargar
  useState(() => {
    updatePreview(initialContent || "")
  })

  const processContent = (content: string) => {
    // Si el modo es HTML, devolver el HTML tal cual
    if (mode === "html") {
      return content
    }

    // Si es markdown, convertir a HTML si es necesario
    // ...

    return content
  }

  return (
    <div className="border rounded-md">
      <div className="flex justify-between p-2 border-b">
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("bold")} title="Negrita">
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("italic")} title="Cursiva">
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("heading1")} title="Título 1">
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("heading2")} title="Título 2">
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("heading3")} title="Título 3">
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("list")} title="Lista">
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("code")} title="Código">
            <Code className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("quote")} title="Cita">
            <Quote className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("link")} title="Enlace">
            <Link className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => document.getElementById("image-upload")?.click()}
            title="Imagen"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(value as "markdown" | "html")}>
          <TabsList>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
        <div className="col-span-1">
          <Textarea
            value={content}
            onChange={handleChange}
            className="min-h-[400px] font-mono text-sm resize-none"
            placeholder={
              mode === "markdown" ? "Escribe tu contenido en Markdown..." : "Escribe tu contenido en HTML..."
            }
          />
        </div>
        <div className="col-span-1 border rounded p-4 min-h-[400px] prose max-w-none overflow-auto">
          {previewContent ? (
            <div dangerouslySetInnerHTML={{ __html: previewContent }} />
          ) : (
            <p className="text-muted-foreground">Vista previa en tiempo real</p>
          )}
        </div>
      </div>

      <div className="p-2 border-t text-xs text-gray-500">
        {mode === "markdown" ? (
          <p>
            Usa <strong>**negrita**</strong>, <em>*cursiva*</em>, <code>`código`</code>, # Título, ## Subtítulo,
            [enlace](url), ![imagen](url), &gt; cita, - lista
          </p>
        ) : (
          <p>
            Usa etiquetas HTML como <code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>,<code>&lt;h1&gt;</code>,{" "}
            <code>&lt;a href=""&gt;</code>, <code>&lt;img src=""&gt;</code>
          </p>
        )}
      </div>
    </div>
  )
}
