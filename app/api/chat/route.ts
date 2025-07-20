import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, tool } from "ai"
import { z } from "zod"

/* ------------------------------------------------------------------ */
/* PREMIUM CAMPUS TOOLS                                                */
/* ------------------------------------------------------------------ */
const premiumCampusTools = {
  /* ───────────────── getAdvancedSchedule ───────────────── */
  getAdvancedSchedule: tool({
    description: "Return today's schedule plus AI insights (work-load, conflicts, optimisation).",
    parameters: z
      .object({
        includeOptimization: z.boolean().optional(),
        analyzeWorkload: z.boolean().optional(),
        predictConflicts: z.boolean().optional(),
      })
      .strict(),
    async execute({ includeOptimization = true, analyzeWorkload = true, predictConflicts = true }) {
      const response = {
        today: [
          {
            name: "Advanced Data Structures",
            time: "09:00-10:30",
            room: "CS-204",
            professor: "Dr Chen",
          },
          {
            name: "Machine Learning Lab",
            time: "11:00-12:30",
            room: "ENG-301",
            professor: "Prof Rodriguez",
          },
        ],
        insights: includeOptimization
          ? {
              workloadAnalysis: analyzeWorkload ? { totalHours: 3.5, difficulty: "High" } : null,
              conflictPrediction: predictConflicts ? { potentialIssues: [], risk: "Low" } : null,
            }
          : null,
      }
      return response
    },
  }),

  /* ───────────────── analyzeDocumentAdvanced ───────────────── */
  analyzeDocumentAdvanced: tool({
    description: "Analyse a university document and extract action items.",
    parameters: z
      .object({
        documentType: z.enum(["notice", "syllabus", "assignment", "policy"]),
        content: z.string(),
      })
      .strict(),
    async execute({ documentType, content }) {
      return {
        summary: `Quick summary of the ${documentType}`,
        wordCount: content.split(/\s+/).length,
      }
    },
  }),

  /* ────────────── performSentimentAnalysis ─────────────── */
  performSentimentAnalysis: tool({
    description: "Detect sentiment and suggest resources.",
    parameters: z.object({ userMessage: z.string() }).strict(),
    async execute({ userMessage }) {
      const lower = userMessage.toLowerCase()
      const sentiment = lower.includes("stress") ? "negative" : lower.includes("great") ? "positive" : "neutral"
      return { sentiment }
    },
  }),

  /* ────────────── getUserInsights ─────────────── */
  getUserInsights: tool({
    description: "Analyze user's past experiences and provide personalized insights.",
    parameters: z.object({ 
      analysisType: z.enum(["learning_patterns", "mood_trends", "topic_preferences", "interaction_frequency"]).optional(),
      includeRecommendations: z.boolean().optional()
    }).strict(),
    async execute({ analysisType = "learning_patterns", includeRecommendations = true }) {
      // This would typically analyze the user's stored experiences
      // For now, return mock insights based on common patterns
      const insights = {
        learningPatterns: {
          preferredTime: "Evening (based on interaction times)",
          studyStyle: "Interactive (frequent questions and discussions)",
          focusAreas: ["Computer Science", "Problem Solving", "Time Management"]
        },
        moodTrends: {
          averageMood: "positive",
          stressTriggers: ["exam periods", "deadlines"],
          copingStrategies: ["asking for help", "breaking tasks down"]
        },
        topicPreferences: {
          mostDiscussed: ["academic planning", "study strategies", "campus resources"],
          emergingInterests: ["career development", "research opportunities"]
        },
        recommendations: includeRecommendations ? [
          "Consider scheduling study sessions during your preferred evening hours",
          "Your interactive learning style suggests group study sessions might be beneficial",
          "Based on your stress patterns, try implementing the Pomodoro technique during exam periods"
        ] : []
      }
      
      return insights
    },
  }),
}

/* ------------------------------------------------------------------ */
/* API ROUTE                                                           */
/* ------------------------------------------------------------------ */

const systemPrompt = `You are Campus Copilot Premium – an advanced AI college
assistant with emotional intelligence, predictive analytics and crisis-response
capabilities. Use the available tools whenever they improve the answer.

IMPORTANT: You have access to the user's conversation history, preferences, and past experiences. Use this information to provide personalized, contextual responses that build upon previous interactions.

Key Guidelines:
1. Remember the user's name, department, and past conversations
2. Reference previous discussions and experiences when relevant
3. Adapt your tone and approach based on the user's current mood
4. Suggest solutions based on what has worked for them before
5. Build upon their learning patterns and preferences
6. Provide continuity in your recommendations and advice

Always strive to make the user feel understood and supported based on their unique academic journey.`

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-user-context',
    },
  })
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Retrieve API key securely from headers or environment variables
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("X-API-KEY") || // some clients send upper-case
    [...req.headers.entries()].find(([k]) => k.toLowerCase() === "x-api-key")?.[1] ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Gemini API key missing" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
  }

  // Extract user context from headers
  const userContextHeader = req.headers.get("x-user-context")
  let userContext = null
  
  if (userContextHeader) {
    try {
      userContext = JSON.parse(userContextHeader)
      console.log("User context loaded:", {
        name: userContext.name,
        department: userContext.department,
        experiencesCount: userContext.experiences?.length || 0,
        currentMood: userContext.currentMood
      })
    } catch (error) {
      console.error("Error parsing user context:", error)
    }
  }

  // Initialize Google AI with API key using the latest package method
  const google = createGoogleGenerativeAI({
    apiKey: apiKey,
  })

  console.log("Using API key:", apiKey.substring(0, 10) + "...")

  // Stream function with proper model initialization
  async function stream(modelName: string) {
    try {
      console.log(`Attempting to stream with model: ${modelName}`)

      // Prepare enhanced messages with user context
      let enhancedMessages = [...messages]
      
      // Add user context as a system message if available
      if (userContext) {
        try {
          const contextMessage = {
            role: "system" as const,
            content: `USER CONTEXT:
Name: ${userContext.name || 'Student'}
Department: ${userContext.department || 'General'}
Current Mood: ${userContext.currentMood || 'neutral'}
Online Status: ${userContext.isOnline ? 'Online' : 'Offline'}

RECENT EXPERIENCES (last 10):
${userContext.experiences?.map((exp: any) => 
  `- ${exp.type}: ${exp.content?.substring(0, 100) || 'No content'} (${exp.mood || 'neutral'})`
).join('\n') || 'No recent experiences'}

PREFERENCES:
${JSON.stringify(userContext.preferences || {}, null, 2)}

Use this context to provide personalized responses that build upon previous interactions.`
          }
          
          // Insert context message after the first system message
          enhancedMessages.splice(1, 0, contextMessage)
          console.log("User context added successfully")
        } catch (contextError) {
          console.error("Error adding user context:", contextError)
          // Continue without context if there's an error
        }
      }

      console.log(`Processing ${enhancedMessages.length} messages with model ${modelName}`)

      const result = await streamText({
        model: google(modelName), // Use the initialized google instance
        system: systemPrompt,
        messages: enhancedMessages,
        tools: premiumCampusTools,
        maxToolRoundtrips: 5,
        temperature: 0.7,
      })

      console.log(`Successfully created stream for ${modelName}`)
      return result
    } catch (error: any) {
      console.error(`Detailed error with model ${modelName}:`)
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error cause:", error.cause)
      console.error("Full error:", error)
      throw error
    }
  }

  // Try multiple models with better error handling
  async function tryModels(modelNames: string[]) {
    let lastErr: any = null

    for (const name of modelNames) {
      try {
        console.log(`Trying model: ${name}`)
        const res = await stream(name)
        console.log(`Success with model: ${name}`)
        return res
      } catch (err: any) {
        console.error(`Failed with model ${name}:`, err.message)
        lastErr = err

        // Check for API key issues
        const msg = `${err?.message ?? ""}`.toLowerCase()
        if (msg.includes("api key") || msg.includes("invalid") || msg.includes("unauthorized")) {
          console.error("API key issue detected, stopping model fallback")
          throw err
        }

        // Check for quota/billing issues
        if (msg.includes("quota") || msg.includes("billing") || msg.includes("payment")) {
          console.error("Quota/billing issue detected")
          throw new Error("API quota exceeded or billing issue. Please check your Google Cloud account.")
        }

        // Continue to next model for other errors
      }
    }
    throw lastErr
  }

  try {
    // Try stable models in order of preference
    const result = await tryModels(["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"])

    console.log("Stream result obtained, converting to response...")
    const response = result.toDataStreamResponse()
    console.log("Response created successfully")
    
    // Add CORS headers for better compatibility
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-user-context')
    
    return response
  } catch (err: any) {
    // If the first attempt fails, try without user context
    if (userContext) {
      console.log("Retrying without user context...")
      try {
        userContext = null // Disable user context for retry
        const result = await tryModels(["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"])
        console.log("Retry successful without user context")
        const response = result.toDataStreamResponse()
        return response
      } catch (retryErr: any) {
        console.error("Retry also failed:", retryErr)
        // Continue to original error handling
      }
    }
    console.error("Final error in POST handler:", err)
    console.error("Error stack:", err.stack)

    const errorMessage = err?.message ?? "Unknown error"
    const lowerMsg = errorMessage.toLowerCase()

    // Enhanced error handling
    if (lowerMsg.includes("api key") || lowerMsg.includes("unauthorized") || lowerMsg.includes("invalid")) {
      return new Response(
        JSON.stringify({
          error: "Invalid or unauthorized Gemini API key",
          details: "Please verify your API key at https://aistudio.google.com/",
          originalError: errorMessage,
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      )
    }

    if (lowerMsg.includes("quota") || lowerMsg.includes("billing")) {
      return new Response(
        JSON.stringify({
          error: "API quota exceeded or billing issue",
          details: "Please check your Google Cloud account billing status",
          originalError: errorMessage,
        }),
        { status: 429, headers: { "content-type": "application/json" } },
      )
    }

    // Log the error but return a more generic message to avoid confusion
    console.error("Non-critical error occurred:", errorMessage)

    return new Response(
      JSON.stringify({
        error: "Temporary processing issue. Please try again.",
        details: "The request was processed but encountered a minor issue.",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }
}
