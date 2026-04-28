import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { postCreateSchema } from "@/lib/validators"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !["author", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rawBody = await req.json()
    const parsed = postCreateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(e => e.message).join(", ") },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title: parsed.data.title,
        body: parsed.data.body,
        image_url: rawBody.image_url || null,
        author_id: user.id,
        summary_status: "pending",
      })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger summary generation asynchronously (fire and forget)
    // Only if body is long enough to warrant a summary
    if (parsed.data.body.length >= 50) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      fetch(`${siteUrl}/api/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_SUMMARIZE_SECRET || "",
        },
        body: JSON.stringify({ postId: post.id }),
      }).catch(() => {
        // Non-critical: summary generation is best-effort
      })
    } else {
      // Short body — store body as summary
      await supabase
        .from("posts")
        .update({ summary: parsed.data.body, summary_status: "ready" })
        .eq("id", post.id)
    }

    return NextResponse.json({ id: post.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
