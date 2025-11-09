"use server"

import { z } from "zod"
import OpenAI from "openai"
import type { GenerateMotionsResponse, Motion } from "@/types/actions"

const generateMotionsSchema = z.object({
  topic: z.string().optional(),
})

export async function generateMotions(
  input: z.infer<typeof generateMotionsSchema>
): Promise<GenerateMotionsResponse> {
  try {
    // Validate input
    const validatedInput = generateMotionsSchema.parse(input)
    
    // Check for API key
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      return {
        success: false,
        error: "Perplexity API key is not configured. Please add PERPLEXITY_API_KEY to your environment variables.",
      }
    }

    // Initialize Perplexity client using OpenAI SDK
    const perplexity = new OpenAI({
      apiKey,
      baseURL: "https://api.perplexity.ai",
    })

    // Construct the search query
    const searchQuery = validatedInput.topic
      ? `Recent news and developments about ${validatedInput.topic}`
      : "Latest trending news today across politics, technology, environment, and society"

    // Generate debate motions using Perplexity
    const response = await perplexity.chat.completions.create({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `You are an expert debate motion writer. Your task is to create thought-provoking, balanced debate motions based on recent news.

Guidelines for creating debate motions:
- Motions should be controversial and debatable (not obvious statements)
- Use the format of "This House..."(British Parliamentary Debate Format)
- Each motion should be clear, specific, and actionable
- Provide brief reasoning explaining why this is a good debate topic
- Base motions on actual recent events or developments
- Ensure motions can be argued from multiple perspectives

Return exactly 3-5 debate motions in the following JSON format:
{
  "context": "Brief summary of the news/topic being referenced",
  "motions": [
    {
      "text": "This House...",
      "reasoning": "Brief explanation of why this makes a good debate",
      "category": "Category like Politics, Technology, Environment, etc."
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Search for: ${searchQuery}

Based on the latest information you find, generate 3-5 compelling debate motions. Return only valid JSON.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return {
        success: false,
        error: "No response received from Perplexity API",
      }
    }

    // Parse the JSON response
    let parsedData: { context?: string; motions: Motion[] }
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : content
      parsedData = JSON.parse(jsonString)
    } catch (parseError) {
      // If JSON parsing fails, try to extract motions from text
      console.error("Failed to parse JSON:", parseError)
      return {
        success: false,
        error: "Failed to parse AI response. Please try again.",
      }
    }

    // Validate that we have motions
    if (!parsedData.motions || !Array.isArray(parsedData.motions) || parsedData.motions.length === 0) {
      return {
        success: false,
        error: "No motions were generated. Please try again.",
      }
    }

    return {
      success: true,
      data: {
        motions: parsedData.motions,
        context: parsedData.context,
      },
    }
  } catch (error) {
    console.error("Error generating motions:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input provided",
      }
    }

    if (error instanceof Error) {
      // Check for specific API errors
      if (error.message.includes("API key")) {
        return {
          success: false,
          error: "Invalid Perplexity API key. Please check your configuration.",
        }
      }
      
      return {
        success: false,
        error: `Failed to generate motions: ${error.message}`,
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

