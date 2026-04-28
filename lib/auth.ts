import { createClient } from './supabase/server'

export type UserRole = 'author' | 'viewer' | 'admin'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id,name,email,role')
    .eq('id', user.id)
    .single()

  return profile as UserProfile | null
}

export async function requireRole(roles: UserRole[]): Promise<UserProfile> {
  const user = await getCurrentUser()
  if (!user || !roles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}
