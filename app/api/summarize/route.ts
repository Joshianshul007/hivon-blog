import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { summarize } from "@/lib/gemini"

// Use service role client to bypass RLS — this is a server-only internal endpoint
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    // Security guard: only allow calls from within the same app
    // that supply the correct internal secret header.
    const internalSecret = req.headers.get("x-internal-secret")
    if (!internalSecret || internalSecret !== process.env.INTERNAL_SUMMARIZE_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { postId } = await req.json()
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data: post, error } = await supabase
      .from("posts")
      .select("id,body,summary,summary_status")
      .eq("id", postId)
      .single()

    if (error || !post) {
      console.error("[summarize] Post not found:", postId, error?.message)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Cost guard: never regenerate if already ready
    if (post.summary_status === "ready" && post.summary) {
      return NextResponse.json({ summary: post.summary, cached: true })
    }

    try {
      console.log("[summarize] Generating for post:", postId)
      const summary = await summarize(post.body)
      await supabase
        .from("posts")
        .update({ summary, summary_status: "ready" })
        .eq("id", postId)

      console.log("[summarize] Success for post:", postId)
      return NextResponse.json({ summary, cached: false })
    } catch (err) {
      console.error("[summarize] Gemini error:", err)
      await supabase
        .from("posts")
        .update({ summary_status: "failed" })
        .eq("id", postId)

      return NextResponse.json({ error: "Summary generation failed" }, { status: 500 })
    }
  } catch (err) {
    console.error("[summarize] Internal error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
