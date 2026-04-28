"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { signupSchema } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"author" | "viewer">("viewer")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const parsed = signupSchema.safeParse({ name, email, password, role })
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message)
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            name: parsed.data.name,
            role: parsed.data.role,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      toast.success("Account created! Redirecting to dashboard...")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Choose your role and start using Hivon Blog
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-role">Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "author" | "viewer")}
                disabled={loading}
              >
                <SelectTrigger id="signup-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer — Read &amp; comment on posts</SelectItem>
                  <SelectItem value="author">Author — Create &amp; manage posts</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Authors can create and manage their own posts. Viewers can read and comment.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
