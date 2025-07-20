import { type NextRequest, NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google" // Changed import to createGoogleGenerativeAI
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json()

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // Initialize Google AI with API key using the latest package method
    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    })

    // Test with the latest stable model first, fallback to older ones
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]

    for (const modelName of modelsToTry) {
      try {
        const result = await generateText({
          model: google(modelName), // Use the initialized google instance
          prompt: "Hello",
          maxTokens: 10,
        })

        if (result.text) {
          return NextResponse.json({ valid: true, model: modelName })
        }
      } catch (error) {
        // Try next model
        continue
      }
    }

    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  } catch (error) {
    console.error("API key validation error:", error)
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }
}
