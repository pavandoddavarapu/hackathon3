export class DataStore {
  private storageKey = "campus_copilot_data"

  constructor() {
    this.initializeData()
  }

  private initializeData() {
    if (typeof window === "undefined") return

    const existing = localStorage.getItem(this.storageKey)
    if (!existing) {
      const initialData = {
        user: { name: "", department: "Computer Science", preferences: {} },
        classes: this.getMockClasses(),
        notices: this.getMockNotices(),
        events: this.getMockEvents(),
        locations: this.getMockLocations(),
        reminders: [],
      }
      localStorage.setItem(this.storageKey, JSON.stringify(initialData))
    }
  }

  private getData() {
    if (typeof window === "undefined") return this.getDefaultData()

    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : this.getDefaultData()
  }

  private saveData(data: any) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  private getDefaultData() {
    return {
      user: { name: "", department: "Computer Science", preferences: {} },
      classes: this.getMockClasses(),
      notices: this.getMockNotices(),
      events: this.getMockEvents(),
      locations: this.getMockLocations(),
      reminders: [],
    }
  }

  getUserData() {
    return this.getData().user
  }

  setUserData(userData: any) {
    const data = this.getData()
    data.user = { ...data.user, ...userData }
    this.saveData(data)
  }

  getTodayClasses() {
    const today = new Date().getDay()
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const currentDay = dayNames[today]

    return this.getData().classes.filter((cls: any) => cls.days.includes(currentDay) || cls.days.includes("Daily"))
  }

  getNotices() {
    return this.getData().notices
  }

  getRecommendedEvents() {
    const userDept = this.getUserData().department
    return this.getData().events.filter((event: any) => event.department === userDept || event.department === "All")
  }

  getLocationInfo(location: string) {
    const locations = this.getData().locations
    const found = locations.find((loc: any) => loc.name.toLowerCase().includes(location.toLowerCase()))

    return (
      found || {
        location: location,
        walkingTime: "5-10 minutes",
        building: "Main Campus",
      }
    )
  }

  detectConflicts() {
    const classes = this.getTodayClasses()
    const conflicts = []

    // Simple conflict detection
    for (let i = 0; i < classes.length - 1; i++) {
      const current = classes[i]
      const next = classes[i + 1]

      if (this.timeOverlap(current.time, next.time)) {
        conflicts.push({
          title: `${current.name} conflicts with ${next.name}`,
          description: `Both scheduled around ${current.time}`,
        })
      }
    }

    return conflicts
  }

  private timeOverlap(time1: string, time2: string): boolean {
    // Simple overlap detection - in real app, use proper time parsing
    return time1.split("-")[0] === time2.split("-")[0]
  }

  private getMockClasses() {
    return [
      {
        name: "Data Structures",
        time: "9:00-10:30",
        room: "Room 204",
        professor: "Dr. Smith",
        days: ["Monday", "Wednesday", "Friday"],
      },
      {
        name: "Machine Learning",
        time: "11:00-12:30",
        room: "Lab 301",
        professor: "Prof. Johnson",
        days: ["Tuesday", "Thursday"],
      },
      {
        name: "Database Systems",
        time: "2:00-3:30",
        room: "Room 105",
        professor: "Dr. Brown",
        days: ["Monday", "Wednesday"],
      },
      {
        name: "Software Engineering",
        time: "4:00-5:30",
        room: "Room 302",
        professor: "Prof. Davis",
        days: ["Tuesday", "Thursday"],
      },
    ]
  }

  private getMockNotices() {
    return [
      {
        title: "Mid-term Exam Schedule Released",
        content:
          "The mid-term examination schedule has been published. Exams will be conducted from March 15-22. Students must carry their ID cards. No electronic devices allowed. Report 30 minutes before exam time.",
        date: new Date().toISOString(),
        department: "All",
      },
      {
        title: "Library Hours Extended",
        content:
          "Due to upcoming exams, library hours are extended until 11 PM on weekdays. Weekend hours remain 9 AM to 6 PM. Group study rooms can be booked online.",
        date: new Date().toISOString(),
        department: "All",
      },
    ]
  }

  private getMockEvents() {
    return [
      {
        name: "AI Workshop",
        date: "March 20",
        location: "Auditorium",
        department: "Computer Science",
        description: "Hands-on workshop on machine learning",
      },
      {
        name: "Tech Talk: Future of Web Development",
        date: "March 22",
        location: "Conference Hall",
        department: "Computer Science",
        description: "Industry expert discussion",
      },
      {
        name: "Career Fair",
        date: "March 25",
        location: "Main Ground",
        department: "All",
        description: "Meet recruiters from top companies",
      },
      {
        name: "Coding Competition",
        date: "March 28",
        location: "Computer Lab",
        department: "Computer Science",
        description: "Inter-college programming contest",
      },
    ]
  }

  private getMockLocations() {
    return [
      {
        name: "Room 204",
        building: "Academic Block A",
        walkingTime: "3 minutes",
        floor: "2nd Floor",
      },
      {
        name: "Lab 301",
        building: "Computer Science Block",
        walkingTime: "5 minutes",
        floor: "3rd Floor",
      },
      {
        name: "Library",
        building: "Central Library",
        walkingTime: "2 minutes",
        floor: "Ground Floor",
      },
      {
        name: "Auditorium",
        building: "Main Building",
        walkingTime: "7 minutes",
        floor: "Ground Floor",
      },
    ]
  }
}

export type ScheduleEvent = {
  id: string;
  title: string;
  start: string; // ISO string
  end: string;   // ISO string
  location?: string;
  notes?: string;
};

export function getSchedule(): ScheduleEvent[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('campus_schedule') || '[]');
}

export function saveSchedule(events: ScheduleEvent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('campus_schedule', JSON.stringify(events));
}
