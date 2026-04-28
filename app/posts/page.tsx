import { Suspense } from "react"
import { getPublicClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/post-card"

export const revalidate = 60 // Cache page for 60 seconds
import { SearchBar } from "@/components/search-bar"
import { Pagination } from "@/components/pagination"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Posts",
  description: "Browse all blog posts on Hivon Blog. Search and discover great content.",
}

const POSTS_PER_PAGE = 10

interface PostsPageProps {
  searchParams: { q?: string; page?: string }
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const search = searchParams.q || ""
  const page = Math.max(1, parseInt(searchParams.page || "1") || 1)

  const supabase = getPublicClient()

  let query = supabase
    .from("posts")
    .select("id,title,summary,summary_status,image_url,created_at,author:users(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE - 1)

  if (search) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
  }

  const { data: posts, count, error } = await query

  const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-1">
            {search ? `Search results for "${search}"` : "Browse all blog posts"}
            {count !== null && ` · ${count} post${count !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded-md bg-muted" />}>
          <SearchBar />
        </Suspense>
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load posts. Please try again later.</p>
        </div>
      ) : posts && posts.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                summary={post.summary}
                summary_status={post.summary_status}
                image_url={post.image_url}
                created_at={post.created_at}
                author={post.author as unknown as { name: string } | null}
              />
            ))}
          </div>
          <Suspense fallback={null}>
            <Pagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </>
      ) : (
        <div className="text-center py-12 space-y-2">
          <p className="text-lg font-medium">No posts found</p>
          <p className="text-muted-foreground">
            {search ? "Try a different search term." : "No posts have been published yet."}
          </p>
        </div>
      )}
    </div>
  )
}
