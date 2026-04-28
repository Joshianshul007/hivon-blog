import { GoogleGenerativeAI } from '@google/generative-ai'

const client = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function summarize(body: string): Promise<string> {
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
  // Cap input tokens — never send more than ~4k chars to keep cost low
  const trimmed = body.slice(0, 4000)
  const prompt = `Summarize the following blog post in approximately 200 words.
Be neutral, factual, and avoid first-person narration. Output plain text only.

POST:
"""
${trimmed}
"""`

  const timeoutMs = 20_000
  const result = await Promise.race([
    model.generateContent(prompt),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), timeoutMs)
    ),
  ])
  return result.response.text().trim()
}
