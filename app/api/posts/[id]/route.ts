import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { postUpdateSchema } from "@/lib/validators"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch existing post to check ownership
    const { data: existing, error: fetchError } = await supabase
      .from("posts")
      .select("id,author_id,body")
      .eq("id", params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Authorization: only author or admin
    if (existing.author_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rawBody = await req.json()
    const parsed = postUpdateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(e => e.message).join(", ") },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.body !== undefined) updateData.body = parsed.data.body
    if (rawBody.image_url !== undefined) updateData.image_url = rawBody.image_url

    // Only regenerate summary if body actually changed
    const bodyChanged = parsed.data.body !== undefined && parsed.data.body !== existing.body
    if (bodyChanged) {
      updateData.summary_status = "pending"
      updateData.summary = null
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", params.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Regenerate summary if body changed
    if (bodyChanged && parsed.data.body && parsed.data.body.length >= 50) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      fetch(`${siteUrl}/api/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_SUMMARIZE_SECRET || "",
        },
        body: JSON.stringify({ postId: params.id }),
      }).catch(() => {})
    } else if (bodyChanged && parsed.data.body && parsed.data.body.length < 50) {
      await supabase
        .from("posts")
        .update({ summary: parsed.data.body, summary_status: "ready" })
        .eq("id", params.id)
    }

    return NextResponse.json({ id: params.id, updated: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch post to check ownership
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id,author_id,image_url")
      .eq("id", params.id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.author_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the post (comments cascade via FK)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Try to delete image from storage if exists
    if (post.image_url) {
      try {
        const url = new URL(post.image_url)
        const path = url.pathname.split("/post-images/").pop()
        if (path) {
          await supabase.storage.from("post-images").remove([path])
        }
      } catch {
        // Non-critical: image cleanup is best-effort
      }
    }

    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
