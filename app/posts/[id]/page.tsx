import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { CalendarDays, User, Sparkles, ArrowLeft, Pencil, RefreshCw, Eye, Clock } from "lucide-react"
import { ReadingProgress } from "@/components/reading-progress"
import { ViewTracker } from "@/components/view-tracker"
import { SafeHTML } from "@/components/safe-html"
import type { Metadata } from "next"
import { cache } from "react"
import dynamic from "next/dynamic"

const ShareButtons = dynamic(() => import("@/components/share-buttons").then(mod => mod.ShareButtons), {
  loading: () => <div className="h-10 w-full bg-muted animate-pulse rounded-md mt-6" />
})

const CommentsSection = dynamic(() => import("@/components/comments-section").then(mod => mod.CommentsSection), {
  loading: () => <div className="h-40 w-full bg-muted animate-pulse rounded-md mt-12" />
})

interface PostPageProps {
  params: { id: string }
}

const getPost = cache(async (id: string) => {
  const supabase = await createClient()
  return supabase
    .from("posts")
    .select("id,title,body,image_url,summary,summary_status,created_at,updated_at,author_id,views,author:users(name,email)")
    .eq("id", id)
    .single()
})

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { data: post } = await getPost(params.id)

  if (!post) return { title: "Post Not Found" }

  const authorName = (post.author as unknown as { name: string } | null)?.name || "Guest"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const ogUrl = new URL(`${siteUrl}/api/og`)
  ogUrl.searchParams.set("title", post.title)
  ogUrl.searchParams.set("author", authorName)

  return {
    title: post.title,
    description: post.summary || `Read "${post.title}" on Hivon Blog`,
    openGraph: {
      title: post.title,
      description: post.summary || `Read "${post.title}" on Hivon Blog`,
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary || `Read "${post.title}" on Hivon Blog`,
      images: [ogUrl.toString()],
    },
  }
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const { data: post, error } = await getPost(params.id)

  if (error || !post) {
    notFound()
  }

  const { data: comments } = await supabase
    .from("comments")
    .select("id,comment_text,created_at,user_id,user:users(name)")
    .eq("post_id", params.id)
    .order("created_at", { ascending: true })

  const canEdit = user && (user.id === post.author_id || user.role === "admin")
  const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const wordCount = post.body.trim().split(/\s+/).length
  const timeToRead = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <>
      <ReadingProgress />
      <ViewTracker postId={post.id} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Link>
        </Button>
      </div>

      <article className="space-y-6">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {post.author && (
              <Link href={`/authors/${post.author_id}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <User className="h-4 w-4" />
                {(post.author as unknown as { name: string } | null)?.name}
              </Link>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {timeToRead} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {post.views || 0} views
            </span>
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/posts/${post.id}/edit`}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {post.image_url && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        )}

        {/* AI Summary */}
        {post.summary_status === "ready" && post.summary && (
          <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
              AI-Generated Summary
            </div>
            <p className="text-sm text-muted-foreground">{post.summary}</p>
          </div>
        )}
        {post.summary_status === "pending" && (
          <div className="rounded-lg border bg-muted/50 p-4 flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            AI summary is being generated...
          </div>
        )}
        {post.summary_status === "failed" && (
          <div className="rounded-lg border bg-destructive/10 p-4 text-sm text-muted-foreground">
            Summary unavailable. The AI service may be temporarily down.
          </div>
        )}

        {/* Post Body */}
        <SafeHTML
          html={post.body}
          className="prose prose-neutral dark:prose-invert max-w-none"
        />
        
        <div className="pt-8 mt-8 border-t">
          <ShareButtons title={post.title} />
        </div>
      </article>

      {/* Comments Section */}
      <CommentsSection
        postId={post.id}
        initialComments={(comments || []) as unknown as Array<{id: string; comment_text: string; created_at: string; user_id: string; user: {name: string} | null}>}
        currentUserId={user?.id || null}
        currentUserRole={user?.role || null}
        currentUserName={user?.name || null}
      />
    </div>
    </>
  )
}
