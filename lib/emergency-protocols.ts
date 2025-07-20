export class EmergencyProtocols {
  static getEmergencyResponse(type: string, urgency: string) {
    const protocols = {
      medical: {
        critical: {
          immediate: "Call 911 immediately",
          campus: "Campus Health: (555) 123-4567",
          location: "Health Center - Main Building",
          followUp: ["Stay with the person", "Provide first aid if trained", "Wait for emergency services"],
        },
        high: {
          immediate: "Visit Campus Health Center",
          campus: "Walk-in hours: 8 AM - 6 PM",
          location: "Health Center - Main Building",
          followUp: ["Bring student ID", "List current medications", "Describe symptoms clearly"],
        },
      },
      mental_health: {
        critical: {
          immediate: "Call Crisis Hotline: 988",
          campus: "Campus Counseling: (555) 123-4568",
          location: "Counseling Center - Student Services",
          followUp: ["Stay with the person", "Remove harmful objects", "Professional help needed"],
        },
        high: {
          immediate: "Contact Campus Counseling",
          campus: "24/7 Crisis Support available",
          location: "Counseling Center - Student Services",
          followUp: ["Schedule regular sessions", "Develop coping strategies", "Build support network"],
        },
      },
      academic: {
        high: {
          immediate: "Contact Academic Advisor",
          campus: "Dean's Office: (555) 123-4570",
          location: "Academic Affairs - Admin Building",
          followUp: ["Gather relevant documents", "Prepare explanation", "Explore options"],
        },
      },
      safety: {
        critical: {
          immediate: "Call Campus Security: (555) 123-4569",
          campus: "Emergency Blue Light Phones",
          location: "Security Office - Main Gate",
          followUp: ["Move to safe location", "Document incident", "Report to authorities"],
        },
      },
    }

    return protocols[type as keyof typeof protocols]?.[urgency as keyof any] || null
  }

  static assessThreatLevel(description: string): "low" | "medium" | "high" | "critical" {
    const criticalKeywords = ["suicide", "self-harm", "violence", "weapon", "attack", "emergency"]
    const highKeywords = ["crisis", "urgent", "immediate", "danger", "threat", "panic"]
    const mediumKeywords = ["worried", "concerned", "anxious", "stressed", "help"]

    const lowerDesc = description.toLowerCase()

    if (criticalKeywords.some((keyword) => lowerDesc.includes(keyword))) return "critical"
    if (highKeywords.some((keyword) => lowerDesc.includes(keyword))) return "high"
    if (mediumKeywords.some((keyword) => lowerDesc.includes(keyword))) return "medium"

    return "low"
  }
}
