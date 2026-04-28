import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PostForm } from "@/components/post-form"
import type { Metadata } from "next"

interface EditPostPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: EditPostPageProps): Promise<Metadata> {
  const supabase = await createClient()
  const { data: post } = await supabase.from("posts").select("title").eq("id", params.id).single()
  return { title: post ? `Edit: ${post.title}` : "Edit Post" }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data: post, error } = await supabase
    .from("posts").select("id,title,body,image_url,author_id").eq("id", params.id).single()

  if (error || !post) notFound()

  if (post.author_id !== user.id && user.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p className="text-muted-foreground mt-2">You do not have permission to edit this post.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PostForm mode="edit" initialData={{ id: post.id, title: post.title, body: post.body, image_url: post.image_url }} />
    </div>
  )
}
