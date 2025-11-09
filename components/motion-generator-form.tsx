"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { generateMotions } from "@/app/actions/generate-motions"
import type { Motion } from "@/types/actions"
import { Sparkles, Loader2, AlertCircle } from "lucide-react"

export function MotionGeneratorForm() {
  const [topic, setTopic] = useState("")
  const [motions, setMotions] = useState<Motion[]>([])
  const [context, setContext] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMotions([])
    setContext("")

    try {
      const result = await generateMotions({ topic: topic.trim() || undefined })

      if (result.success && result.data) {
        setMotions(result.data.motions)
        setContext(result.data.context || "")
      } else {
        setError(result.error || "Failed to generate motions")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Generate Debate Motions
          </CardTitle>
          <CardDescription>
            Enter a topic to get motions about recent news on that subject, or leave
            it blank to get motions based on today's trending news.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic (Optional)</Label>
              <Input
                id="topic"
                placeholder="e.g., artificial intelligence, climate change, space exploration..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to explore today's trending news
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Motions...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Motions
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {context && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">News Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {context}
            </p>
          </CardContent>
        </Card>
      )}

      {motions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Generated Debate Motions
          </h2>
          <div className="grid gap-4">
            {motions.map((motion, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg leading-relaxed">
                      {motion.text}
                    </CardTitle>
                    {motion.category && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary whitespace-nowrap">
                        {motion.category}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {motion.reasoning}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

