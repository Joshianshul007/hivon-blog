import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/post-card"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface AuthorPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const supabase = await createClient()
  const { data: user } = await supabase
    .from("users")
    .select("name")
    .eq("id", params.id)
    .single()

  if (!user) return { title: "Author Not Found" }

  return {
    title: `${user.name}'s Profile`,
    description: `Read all blog posts by ${user.name} on Hivon Blog.`,
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const supabase = await createClient()

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id,name,email,created_at")
    .eq("id", params.id)
    .single()

  if (userError || !user) {
    notFound()
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id,title,summary,summary_status,image_url,created_at,author_id,author:users(name)")
    .eq("author_id", params.id)
    .order("created_at", { ascending: false })

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long"
  })

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-12 bg-muted/30 rounded-2xl p-8 border">
        <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground mt-1">Member since {memberSince}</p>
        </div>
        <div className="flex gap-4 text-sm mt-2">
          <div className="flex flex-col items-center">
            <span className="font-semibold text-lg">{posts?.length || 0}</span>
            <span className="text-muted-foreground">Posts</span>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Articles by {user.name}</h2>
        
        {posts && posts.length > 0 ? (
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
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">{user.name} hasn&apos;t published any posts yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
