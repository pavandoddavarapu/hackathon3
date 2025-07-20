import { NextResponse } from "next/server"
import { StudentDataStore } from "@/lib/student-data-store"
import type { StudentProfile } from "@/lib/types"

const studentDataStore = new StudentDataStore()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")

  if (studentId) {
    const profile = studentDataStore.getProfile(studentId)
    if (profile) {
      return NextResponse.json(profile)
    } else {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 })
    }
  } else {
    // Return a count or list of IDs for the dashboard
    return NextResponse.json({
      studentCount: studentDataStore.getStudentCount(),
      studentIds: studentDataStore.getAllStudentIds(),
    })
  }
}

export async function POST(request: Request) {
  try {
    const profileData: StudentProfile = await request.json()

    // Basic validation
    if (!profileData.name || !profileData.studentId || !profileData.email || !profileData.major) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Assign a unique ID if it's a new profile
    if (!profileData.id) {
      profileData.id = crypto.randomUUID() // Use Web Crypto API for UUID
    }

    const savedProfile = studentDataStore.saveProfile(profileData)
    return NextResponse.json(savedProfile, { status: 200 })
  } catch (error) {
    console.error("Error saving student profile:", error)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }
}
