// Build-time env var validation
// Throws at build time if any required var is undefined

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
}

// Server-only env vars — only call from server context
export function getServerEnv() {
  return {
    SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    GOOGLE_GEMINI_API_KEY: requireEnv('GOOGLE_GEMINI_API_KEY'),
  }
}
