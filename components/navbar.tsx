"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PenSquare, LogOut, LayoutDashboard, User, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

export function Navbar() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async (authUser: SupabaseUser) => {
      const { data: profile } = await supabase
        .from("users")
        .select("id,name,email,role")
        .eq("id", authUser.id)
        .single()
      
      if (profile) {
        // Guarantee name is not empty if DB row somehow has null name
        setUser({
          ...profile,
          name: profile.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name || "User",
          role: profile.role || "viewer"
        })
      } else {
        // Fallback to auth metadata if DB row is missing or blocked by RLS
        setUser({
          id: authUser.id,
          name: authUser.user_metadata?.name || "User",
          email: authUser.email || "",
          role: authUser.user_metadata?.role || "viewer",
        })
      }
    }

    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        await fetchProfile(authUser)
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await fetchProfile(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <PenSquare className="h-6 w-6 text-primary" />
          <span>Hivon Blog</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/posts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Posts
          </Link>

          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">Role: {user.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {(user.role === "author" || user.role === "admin") && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/posts/new" className="cursor-pointer">
                      <PenSquare className="mr-2 h-4 w-4" />
                      New Post
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
          <ThemeToggle />
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div className={cn(
        "md:hidden border-t overflow-hidden transition-all duration-200",
        mobileOpen ? "max-h-64 py-4" : "max-h-0"
      )}>
        <div className="container mx-auto px-4 flex flex-col gap-3">
          <Link href="/posts" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
            Posts
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
              {(user.role === "author" || user.role === "admin") && (
                <Link href="/dashboard/posts/new" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
                  New Post
                </Link>
              )}
              <button onClick={handleSignOut} className="text-sm font-medium text-destructive text-left">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Log In
              </Link>
              <Link href="/signup" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
