import type { StudentPerformanceRecord } from "./student-performance-data"
import { mockStudentPerformanceData } from "./student-performance-data"

export class AdvancedAnalytics {
  static analyzeSentiment(text: string) {
    const sentimentPatterns = {
      positive: {
        keywords: ["happy", "excited", "great", "awesome", "love", "amazing", "wonderful", "fantastic", "excellent"],
        phrases: ["feeling good", "going well", "really happy", "so excited"],
        intensity: 1.0,
      },
      negative: {
        keywords: ["stressed", "worried", "anxious", "tired", "overwhelmed", "sad", "frustrated", "depressed"],
        phrases: ["feeling down", "really stressed", "can't handle", "too much"],
        intensity: 1.0,
      },
      urgent: {
        keywords: ["emergency", "urgent", "help", "crisis", "immediate", "asap", "now"],
        phrases: ["need help", "right now", "as soon as possible"],
        intensity: 1.5,
      },
    }

    const lowerText = text.toLowerCase()
    let maxScore = 0
    let detectedSentiment = "neutral"

    for (const [sentiment, patterns] of Object.entries(sentimentPatterns)) {
      let score = 0

      // Check keywords
      patterns.keywords.forEach((keyword) => {
        if (lowerText.includes(keyword)) {
          score += patterns.intensity
        }
      })

      // Check phrases
      patterns.phrases.forEach((phrase) => {
        if (lowerText.includes(phrase)) {
          score += patterns.intensity * 1.5
        }
      })

      if (score > maxScore) {
        maxScore = score
        detectedSentiment = sentiment
      }
    }

    return {
      sentiment: detectedSentiment,
      confidence: Math.min(maxScore / 3, 1.0),
      score: maxScore,
    }
  }

  static analyzeDocument(content: string, type: string) {
    const analysis = {
      keyDates: this.extractDates(content),
      importantNumbers: this.extractNumbers(content),
      actionItems: this.extractActionItems(content),
      contacts: this.extractContacts(content),
      urgency: this.assessUrgency(content),
      complexity: this.assessComplexity(content),
    }

    return analysis
  }

  private static extractDates(text: string): string[] {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g, // MM-DD-YYYY
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    ]

    const dates: string[] = []
    datePatterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) dates.push(...matches)
    })

    return [...new Set(dates)]
  }

  private static extractNumbers(text: string): string[] {
    const numberPatterns = [
      /\b\d+\s*(minutes?|hours?|days?|weeks?|months?)\b/gi,
      /\b\d+:\d+\s*(AM|PM)?\b/gi,
      /\$\d+(\.\d{2})?\b/g,
    ]

    const numbers: string[] = []
    numberPatterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) numbers.push(...matches)
    })

    return [...new Set(numbers)]
  }

  private static extractActionItems(text: string): string[] {
    const actionPatterns = [
      /must\s+[^.!?]+/gi,
      /required\s+to\s+[^.!?]+/gi,
      /need\s+to\s+[^.!?]+/gi,
      /should\s+[^.!?]+/gi,
    ]

    const actions: string[] = []
    actionPatterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) actions.push(...matches.map((m) => m.trim()))
    })

    return [...new Set(actions)]
  }

  private static extractContacts(text: string): string[] {
    const contactPatterns = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
      /$$\d{3}$$\s*\d{3}-\d{4}/g, // Phone (123) 456-7890
      /\b\d{3}-\d{3}-\d{4}\b/g, // Phone 123-456-7890
    ]

    const contacts: string[] = []
    contactPatterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) contacts.push(...matches)
    })

    return [...new Set(contacts)]
  }

  private static assessUrgency(text: string): "low" | "medium" | "high" | "critical" {
    const urgencyKeywords = {
      critical: ["emergency", "urgent", "immediate", "asap", "crisis"],
      high: ["important", "deadline", "due", "required", "must"],
      medium: ["should", "recommended", "suggested", "please"],
    }

    const lowerText = text.toLowerCase()
    const criticalKeywords = urgencyKeywords.critical
    const highKeywords = urgencyKeywords.high
    const mediumKeywords = urgencyKeywords.medium

    if (criticalKeywords.some((keyword) => lowerText.includes(keyword))) return "critical"
    if (highKeywords.some((keyword) => lowerText.includes(keyword))) return "high"
    if (mediumKeywords.some((keyword) => lowerText.includes(keyword))) return "medium"

    return "low"
  }

  private static assessComplexity(text: string): "low" | "medium" | "high" {
    const wordCount = text.split(/\s+/).length
    const sentenceCount = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0

    if (wordCount > 500 || avgWordsPerSentence > 20) return "high"
    if (wordCount > 200 || avgWordsPerSentence > 15) return "medium"
    return "low"
  }

  // New methods for student performance analytics
  static getAverageScores(data: StudentPerformanceRecord[]): { math: number; reading: number; writing: number } {
    if (data.length === 0) return { math: 0, reading: 0, writing: 0 }

    const totalMath = data.reduce((sum, record) => sum + record.math_score, 0)
    const totalReading = data.reduce((sum, record) => sum + record.reading_score, 0)
    const totalWriting = data.reduce((sum, record) => sum + record.writing_score, 0)

    return {
      math: Number.parseFloat((totalMath / data.length).toFixed(1)),
      reading: Number.parseFloat((totalReading / data.length).toFixed(1)),
      writing: Number.parseFloat((totalWriting / data.length).toFixed(1)),
    }
  }

  static getPerformanceByGender(data: StudentPerformanceRecord[]): {
    male: { math: number; reading: number; writing: number }
    female: { math: number; reading: number; writing: number }
  } {
    const males = data.filter((s) => s.gender === "male")
    const females = data.filter((s) => s.gender === "female")

    return {
      male: this.getAverageScores(males),
      female: this.getAverageScores(females),
    }
  }

  static getTestPrepImpact(data: StudentPerformanceRecord[]): {
    completed: { math: number; reading: number; writing: number }
    none: { math: number; reading: number; writing: number }
  } {
    const completed = data.filter((s) => s.test_preparation_course === "completed")
    const none = data.filter((s) => s.test_preparation_course === "none")

    return {
      completed: this.getAverageScores(completed),
      none: this.getAverageScores(none),
    }
  }

  static getOverallPerformanceSummary(): {
    averageScores: { math: number; reading: number; writing: number }
    genderPerformance: {
      male: { math: number; reading: number; writing: number }
      female: { math: number; reading: number; writing: number }
    }
    testPrepPerformance: {
      completed: { math: number; reading: number; writing: number }
      none: { math: number; reading: number; writing: number }
    }
  } {
    const data = mockStudentPerformanceData // Use the mock data

    return {
      averageScores: this.getAverageScores(data),
      genderPerformance: this.getPerformanceByGender(data),
      testPrepPerformance: this.getTestPrepImpact(data),
    }
  }
}
