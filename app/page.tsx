import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, PenSquare, Sparkles, Shield, MessageSquare } from "lucide-react"
import { getPublicClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/post-card"

export const revalidate = 60 // Cache page for 60 seconds

export default async function HomePage() {
  const supabase = getPublicClient()
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id,title,summary,summary_status,image_url,created_at,author:users(name)")
    .order("created_at", { ascending: false })
    .limit(3)
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Share Your Ideas with{" "}
              <span className="text-primary">AI-Powered</span> Insights
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Hivon Blog is a modern blogging platform where every post gets an
              AI-generated summary. Write, share, and discover content effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/posts">Browse Posts</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Everything you need to blog
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<PenSquare className="h-6 w-6" />}
            title="Rich Post Editor"
            description="Create beautiful blog posts with featured images and a clean editing experience."
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="AI Summaries"
            description="Every post automatically receives a 200-word AI-generated summary powered by Google Gemini."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Role-Based Access"
            description="Authors create posts, Viewers read & comment, Admins moderate everything."
          />
          <FeatureCard
            icon={<MessageSquare className="h-6 w-6" />}
            title="Comments"
            description="Engage with the community through a clean commenting system with moderation."
          />
        </div>
      </section>

      {/* Recent Posts Section */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Recent Articles</h2>
          {recentPosts && recentPosts.length > 0 && (
            <Button variant="ghost" asChild>
              <Link href="/posts">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        
        {!recentPosts || recentPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border bg-muted/30">
            <PenSquare className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles published yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to share your ideas with the world.</p>
            <Button asChild>
              <Link href="/signup">Write an Article</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                summary={post.summary}
                summary_status={post.summary_status}
                image_url={post.image_url}
                created_at={post.created_at}
                author={post.author as unknown as { name: string } | null}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to start writing?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join Hivon Blog today and share your thoughts with the world.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Create Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
