import type React from "react"
import type { GetStaticProps, GetStaticPaths } from "next"
import { serialize } from "next-mdx-remote/serialize"
import { MDXRemote } from "next-mdx-remote"
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import type { Blog } from "../../types/blog"
import Container from "../ui/Container"
import { formatDate } from "../../utils/date-formatter"
import Image from "next/image"

interface Props {
  source: any
  frontMatter: Blog
}

const components = {
  Image,
}

const BlogDetail: React.FC<Props> = ({ source, frontMatter }) => {
  return (
    <Container>
      <article className="py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{frontMatter.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {formatDate(frontMatter.date)} - {frontMatter.author}
          </p>
        </header>
        <div className="prose dark:prose-invert max-w-none">
          <MDXRemote {...source} components={components} />
        </div>
      </article>
    </Container>
  )
}

const blogsDirectory = path.join(process.cwd(), "content/blog")

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const filePath = path.join(blogsDirectory, `${params?.slug}.mdx`)
  const fileContent = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(fileContent)
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  })

  return {
    props: {
      source: mdxSource,
      frontMatter: data,
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const fileNames = fs.readdirSync(blogsDirectory)
  const paths = fileNames.map((fileName) => ({
    params: {
      slug: fileName.replace(/\.mdx$/, ""),
    },
  }))

  return {
    paths,
    fallback: false,
  }
}

export default BlogDetail
