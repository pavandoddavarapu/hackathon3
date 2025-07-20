export interface CampusUser {
  name: string
  department: string
  year: number
  preferences: {
    notificationMethod?: "push" | "email" | "sms"
    reminderTiming?: number
    interests?: string[]
  }
}

export interface StudentProfile {
  id: string
  name: string
  studentId: string
  email: string
  dateOfBirth: string // YYYY-MM-DD
  yearOfStudy: number
  major: string
  department: string
  contactNumber: string
  address: string
  emergencyContactName: string
  emergencyContactNumber: string
  interests: string[]
}

export interface CampusClass {
  id: string
  name: string
  time: string
  room: string
  professor: string
  days: string[]
  department: string
}

export interface CampusNotice {
  id: string
  title: string
  content: string
  date: string
  department: string
  priority: "low" | "medium" | "high"
  tags?: string[]
}

export interface CampusEvent {
  id: string
  name: string
  date: string
  time: string
  location: string
  department: string
  description: string
  registrationRequired: boolean
  capacity?: number
  registered?: number
}

export interface CampusLocation {
  name: string
  building: string
  floor: string
  walkingTime: string
  coordinates: string
  landmarks: string
}

export interface Reminder {
  id: string
  title: string
  time: string
  description?: string
  created: string
  status: "scheduled" | "completed" | "cancelled"
}

// New interfaces for map data
export interface MapNode {
  id: string
  name: string
  x: number // X coordinate for SVG rendering
  y: number // Y coordinate for SVG rendering
}

export interface MapEdge {
  from: string // ID of the starting node
  to: string // ID of the ending node
  distance: number // Distance in meters or minutes
}

export interface PathResult {
  path: string[] // Array of node IDs in the shortest path
  distance: number // Total distance of the shortest path
}
