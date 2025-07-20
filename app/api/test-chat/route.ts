import { NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    // Get API key
    const apiKey = req.headers.get("x-api-key") || "AIzaSyAvqht2VBLjYBrG_KWhltddDJYDgyX8S5Q"
    
    // Initialize Google AI
    const google = createGoogleGenerativeAI({ apiKey })
    
    // Get the last user message
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()
    
    if (!lastUserMessage) {
      return NextResponse.json({ 
        error: "No user message found" 
      }, { status: 400 })
    }
    
    // Simple non-streaming response
    const model = google("gemini-1.5-flash")
    const result = await model.generateText({
      prompt: `You are Campus Copilot, an AI university assistant. Respond to: ${lastUserMessage.content}`,
      maxTokens: 1000,
    })
    
    return NextResponse.json({
      role: "assistant",
      content: result.text,
      id: Date.now().toString(),
    })
    
  } catch (error: any) {
    console.error("Test chat error:", error)
    return NextResponse.json({
      error: "Chat processing failed",
      details: error.message
    }, { status: 500 })
  }
} 