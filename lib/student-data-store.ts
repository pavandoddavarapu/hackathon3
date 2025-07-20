import type { StudentProfile } from "./types"

export class StudentDataStore {
  private storageKey = "campus_copilot_student_profiles"

  constructor() {
    this.initializeData()
  }

  private initializeData() {
    if (typeof window === "undefined") return

    const existing = localStorage.getItem(this.storageKey)
    if (!existing) {
      localStorage.setItem(this.storageKey, JSON.stringify([]))
    }
  }

  private getAllProfiles(): StudentProfile[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : []
  }

  private saveAllProfiles(profiles: StudentProfile[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(profiles))
  }

  getProfile(studentId: string): StudentProfile | undefined {
    const profiles = this.getAllProfiles()
    return profiles.find((profile) => profile.studentId === studentId)
  }

  saveProfile(profile: StudentProfile): StudentProfile {
    const profiles = this.getAllProfiles()
    const existingIndex = profiles.findIndex((p) => p.id === profile.id)

    if (existingIndex > -1) {
      profiles[existingIndex] = profile
    } else {
      profiles.push(profile)
    }
    this.saveAllProfiles(profiles)
    return profile
  }

  // For the university dashboard, we might want to get a count or list of all students
  getAllStudentIds(): string[] {
    const profiles = this.getAllProfiles()
    return profiles.map((p) => p.studentId)
  }

  getStudentCount(): number {
    return this.getAllProfiles().length
  }
}
