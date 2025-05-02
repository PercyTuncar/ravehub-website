"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useMutation, useQuery } from "@apollo/client"
import { CREATE_BLOG, UPDATE_BLOG, GET_BLOG } from "../../graphql/queries" // Updated import
import { Editor } from "@tinymce/tinymce-react"
import { useSession } from "next-auth/react"

interface BlogFormProps {
  id?: string
}

const BlogForm: React.FC<BlogFormProps> = ({ id }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isPublished, setIsPublished] = useState(false)

  const [createBlog, { loading: createLoading, error: createError }] = useMutation(CREATE_BLOG, {
    // Updated mutation
    onCompleted: () => {
      router.push("/admin/blog") // Updated route
    },
  })

  const [updateBlog, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_BLOG, {
    // Updated mutation
    onCompleted: () => {
      router.push("/admin/blog") // Updated route
    },
  })

  const {
    loading: queryLoading,
    error: queryError,
    data,
  } = useQuery(GET_BLOG, {
    // Updated query
    variables: { id },
    skip: !id,
  })

  useEffect(() => {
    if (data && data.blog) {
      // Updated data access
      setTitle(data.blog.title) // Updated data access
      setContent(data.blog.content) // Updated data access
      setImageUrl(data.blog.imageUrl) // Updated data access
      setIsPublished(data.blog.isPublished) // Updated data access
    }
  }, [data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user?.email) {
      alert("You must be logged in to create or update blog posts.")
      return
    }

    if (id) {
      await updateBlog({
        variables: {
          id,
          title,
          content,
          imageUrl,
          isPublished,
        },
      })
    } else {
      await createBlog({
        variables: {
          title,
          content,
          imageUrl,
          isPublished,
          authorEmail: session.user.email,
        },
      })
    }
  }

  if (queryLoading) return <p>Loading...</p>
  if (queryError) return <p>Error: {queryError.message}</p>

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Title:</label>
        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="content">Content:</label>
        <Editor
          apiKey="your-api-key"
          value={content}
          onEditorChange={(newContent) => setContent(newContent)}
          init={{
            height: 500,
            menubar: false,
            plugins: [
              "advlist autolink lists link image charmap print preview anchor",
              "searchreplace visualblocks code fullscreen",
              "insertdatetime media table paste code help wordcount",
            ],
            toolbar:
              "undo redo | formatselect | " +
              "bold italic backcolor | alignleft aligncenter " +
              "alignright alignjustify | bullist numlist outdent indent | " +
              "removeformat | help",
            content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          }}
        />
      </div>
      <div>
        <label htmlFor="imageUrl">Image URL:</label>
        <input type="text" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </div>
      <div>
        <label htmlFor="isPublished">Published:</label>
        <input
          type="checkbox"
          id="isPublished"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
      </div>
      <button type="submit" disabled={createLoading || updateLoading}>
        {id ? "Update" : "Create"}
      </button>
      {createError && <p>Error creating blog: {createError.message}</p>}
      {updateError && <p>Error updating blog: {updateError.message}</p>}
    </form>
  )
}

export default BlogForm
