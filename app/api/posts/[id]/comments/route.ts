import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { commentCreateSchema } from "@/lib/validators"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: comments, error } = await supabase
      .from("comments")
      .select("id,comment_text,created_at,user_id,user:users(name)")
      .eq("post_id", params.id)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = commentCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(e => e.message).join(", ") },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify post exists
    const { data: post } = await supabase
      .from("posts")
      .select("id")
      .eq("id", params.id)
      .single()

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        post_id: params.id,
        user_id: user.id,
        comment_text: parsed.data.comment_text,
      })
      .select("id,comment_text,created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const commentId = url.searchParams.get("commentId")
    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch comment to check ownership
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("id,user_id")
      .eq("id", commentId)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Only owner or admin can delete
    if (comment.user_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
