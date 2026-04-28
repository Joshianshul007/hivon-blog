import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PostForm } from "@/components/post-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create New Post",
}

export default async function NewPostPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  if (user.role !== "author" && user.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p className="text-muted-foreground mt-2">
          You do not have permission to create posts. Only Authors and Admins can create posts.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PostForm mode="create" />
    </div>
  )
}
