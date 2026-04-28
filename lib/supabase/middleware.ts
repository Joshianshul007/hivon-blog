import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(req: NextRequest) {
  const res = NextResponse.next({ request: req })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)),
      },
    }
  )
  await supabase.auth.getUser()
  return res
}
