import { DataStore } from "./data-store"
import { NotificationManager } from "./notification-manager"

export class CampusAssistant {
  private dataStore: DataStore
  private notificationManager: NotificationManager

  constructor() {
    this.dataStore = new DataStore()
    this.notificationManager = new NotificationManager()
  }

  async processMessage(message: string, isOnline = true) {
    const intent = this.detectIntent(message.toLowerCase())

    switch (intent) {
      case "agenda":
        return this.getAgenda()
      case "notices":
        return this.summarizeNotices()
      case "reminder":
        return this.setReminder(message)
      case "events":
        return this.getEvents()
      case "map":
        return this.getLocation(message)
      case "conflicts":
        return this.checkConflicts()
      case "help":
        return this.getHelp()
      default:
        return this.getGeneralResponse(message, isOnline)
    }
  }

  private detectIntent(message: string): string {
    const intents = {
      agenda: ["agenda", "schedule", "classes", "today", "timetable"],
      notices: ["notice", "announcement", "news", "update", "summarize"],
      reminder: ["remind", "reminder", "alert", "notify"],
      events: ["event", "workshop", "seminar", "activity", "club"],
      map: ["where", "location", "room", "building", "find", "map"],
      conflicts: ["conflict", "clash", "overlap", "busy"],
      help: ["help", "what can you do", "commands", "features"],
    }

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some((keyword) => message.includes(keyword))) {
        return intent
      }
    }

    return "general"
  }

  private getAgenda() {
    const classes = this.dataStore.getTodayClasses()
    return {
      message: "Here's your agenda for today! 📅",
      component: "agenda",
      data: { classes },
    }
  }

  private summarizeNotices() {
    const notices = this.dataStore.getNotices()
    const summarized = notices.map((notice) => ({
      ...notice,
      summary: this.generateSummary(notice.content),
    }))

    return {
      message: "I've summarized today's important notices for you! 📋",
      component: "notice",
      data: summarized[0] || { title: "No notices today", summary: ["All caught up! 🎉"] },
    }
  }

  private setReminder(message: string) {
    const reminderData = this.parseReminder(message)
    this.notificationManager.scheduleReminder(reminderData)

    return {
      message: "Got it! I'll remind you about that. 🔔",
      component: "reminder",
      data: reminderData,
    }
  }

  private getEvents() {
    const events = this.dataStore.getRecommendedEvents()
    return {
      message: "Here are some events you might be interested in! 🎉",
      component: "events",
      data: { events },
    }
  }

  private getLocation(message: string) {
    const location = this.extractLocation(message)
    const locationData = this.dataStore.getLocationInfo(location)

    return {
      message: `Found it! Here's the location info 📍`,
      component: "map",
      data: locationData,
    }
  }

  private checkConflicts() {
    const conflicts = this.dataStore.detectConflicts()
    return {
      message: conflicts.length > 0 ? "I found some schedule conflicts! ⚠️" : "No conflicts in your schedule! ✅",
      component: "conflict",
      data: { conflicts },
    }
  }

  private getHelp() {
    return {
      message: `I can help you with:
      
🗓️ **Schedule**: "What's my agenda today?"
📋 **Notices**: "Summarize today's notices"  
🔔 **Reminders**: "Remind me about assignment at 3 PM"
🎉 **Events**: "What events are available?"
📍 **Maps**: "Where is Room 204?"
⚠️ **Conflicts**: "Check for schedule conflicts"

Just ask me naturally - I understand! 🤖`,
      component: null,
      data: null,
    }
  }

  private getGeneralResponse(message: string, isOnline: boolean) {
    const responses = [
      "I'm here to help with your college life! Try asking about your schedule, notices, or events. 🎓",
      "That's interesting! How can I assist you with your college tasks today? 📚",
      "I'm your Campus Copilot! Ask me about classes, reminders, events, or campus locations. 🚀",
      "Let me help you stay organized! What would you like to know about your college schedule? 📅",
    ]

    const response = responses[Math.floor(Math.random() * responses.length)]

    return {
      message: isOnline ? response : response + " (Working offline - some features may be limited)",
      component: null,
      data: null,
    }
  }

  private generateSummary(content: string): string[] {
    // Simple summarization logic - in real app, use AI
    const sentences = content.split(".").filter((s) => s.trim().length > 0)
    return sentences.slice(0, 3).map((s) => s.trim())
  }

  private parseReminder(message: string) {
    // Extract reminder details from message
    const timeMatch = message.match(/(\d{1,2}:\d{2}|\d{1,2}\s?(am|pm))/i)
    const time = timeMatch ? timeMatch[0] : "Later today"

    return {
      title: message.replace(/remind me|at \d+|pm|am/gi, "").trim(),
      time: time,
      timestamp: new Date(),
    }
  }

  private extractLocation(message: string): string {
    const locationMatch = message.match(/room\s+(\w+\d+|\d+)|building\s+(\w+)|(\w+\s+hall)/i)
    return locationMatch ? locationMatch[0] : "Unknown location"
  }
}
