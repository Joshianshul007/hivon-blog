import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PenSquare, FileText, Shield, Eye } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  // Stats based on role
  let postsCount = 0
  let commentsCount = 0

  if (user.role === "admin") {
    const { count: pc } = await supabase.from("posts").select("*", { count: "estimated", head: true })
    const { count: cc } = await supabase.from("comments").select("*", { count: "estimated", head: true })
    postsCount = pc || 0
    commentsCount = cc || 0
  } else if (user.role === "author") {
    const { count: pc } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id)
    postsCount = pc || 0
  }

  // Get user's recent posts (author/admin)
  let recentPosts: Array<{ id: string; title: string; created_at: string; summary_status: string | null }> = []
  if (user.role === "author" || user.role === "admin") {
    const query = supabase
      .from("posts")
      .select("id,title,created_at,summary_status")
      .order("created_at", { ascending: false })
      .limit(5)

    const finalQuery = user.role === "author"
      ? query.eq("author_id", user.id)
      : query

    const { data } = await finalQuery
    recentPosts = data || []
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user.name}! You are signed in as{" "}
          <span className="font-medium capitalize">{user.role}</span>.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {(user.role === "author" || user.role === "admin") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {user.role === "admin" ? "Total Posts" : "Your Posts"}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{postsCount}</div>
            </CardContent>
          </Card>
        )}
        {user.role === "admin" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Comments</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{commentsCount}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Role</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user.role}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        {(user.role === "author" || user.role === "admin") && (
          <Button asChild>
            <Link href="/dashboard/posts/new">
              <PenSquare className="mr-2 h-4 w-4" />
              Create New Post
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/posts">Browse Posts</Link>
        </Button>
        {user.role === "admin" && (
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin">Admin Panel</Link>
          </Button>
        )}
      </div>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {user.role === "admin" ? "Recent Posts (All)" : "Your Recent Posts"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <Link href={`/posts/${post.id}`} className="font-medium hover:underline">
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                      {post.summary_status === "pending" && " · Summary generating..."}
                      {post.summary_status === "failed" && " · Summary failed"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/posts/${post.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Viewer message */}
      {user.role === "viewer" && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              As a Viewer, you can browse posts and leave comments.{" "}
              <Link href="/posts" className="text-primary hover:underline">
                Explore posts →
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
