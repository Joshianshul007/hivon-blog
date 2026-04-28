import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { Metadata } from "next"
import { AdminDeleteButton } from "./admin-delete-button"

export const metadata: Metadata = { title: "Admin Panel" }

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p className="text-muted-foreground mt-2">Admin access only.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: posts } = await supabase
    .from("posts")
    .select("id,title,created_at,author:users(name),summary_status")
    .order("created_at", { ascending: false })
    .limit(50)

  const { data: recentComments } = await supabase
    .from("comments")
    .select("id,comment_text,created_at,post_id,user:users(name)")
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage all posts and comments.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>All Posts</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {posts?.map((post) => (
              <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <Link href={`/posts/${post.id}`} className="font-medium hover:underline">{post.title}</Link>
                  <p className="text-xs text-muted-foreground">
                    by {(post.author as unknown as {name:string} | null)?.name} · {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/posts/${post.id}/edit`}>Edit</Link>
                  </Button>
                  <AdminDeleteButton id={post.id} type="post" />
                </div>
              </div>
            ))}
            {(!posts || posts.length === 0) && <p className="text-muted-foreground">No posts yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Comments</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentComments?.map((c) => (
              <div key={c.id} className="flex items-start justify-between py-2 border-b last:border-0 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{c.comment_text}</p>
                  <p className="text-xs text-muted-foreground">
                    by {(c.user as unknown as {name:string} | null)?.name} · {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <AdminDeleteButton id={c.id} type="comment" postId={c.post_id} />
              </div>
            ))}
            {(!recentComments || recentComments.length === 0) && <p className="text-muted-foreground">No comments yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
