import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // We use the service role key here to bypass RLS and increment the view securely
    // without requiring the user to be logged in.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.rpc("increment_post_views", {
      post_id: params.id,
    })

    if (error) {
      console.error("Error incrementing views:", error)
      return NextResponse.json({ error: "Failed to increment views" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
