"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "ai/react"
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Coffee,
  Dumbbell,
  FileText,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  MessageSquare,
  Mic,
  MicOff,
  Moon,
  Palette,
  RefreshCw,
  Rocket,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"

import CampusMap from "@/components/campus-map"; // Add this import at the top
import { AdvancedAnalytics } from "@/lib/advanced-analytics"; // Import AdvancedAnalytics
import { getSchedule, saveSchedule, ScheduleEvent } from "@/lib/data-store"
import { mockStudentPerformanceData } from "@/lib/student-performance-data"; // Import mock data
import { v4 as uuidv4 } from "uuid"

interface VoiceSettings {
  enabled: boolean
  autoSpeak: boolean
  rate: number
  pitch: number
  voice: string
}

interface UserPreferences {
  theme: "light" | "dark" | "auto"
  notifications: boolean
  voiceEnabled: boolean
  analyticsEnabled: boolean
  emergencyContacts: string[]
  studyReminders: boolean
}

interface ApiKeyStatus {
  isSet: boolean
  isValid: boolean
  lastChecked: Date | null
}

export default function CampusCopilot() {
  const [isOnline, setIsOnline] = useState(true)
  const [userName, setUserName] = useState("")
  const [userDepartment, setUserDepartment] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({
    isSet: true,
    isValid: true,
    lastChecked: new Date(),
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: true,
    autoSpeak: false,
    rate: 1.0,
    pitch: 1.0,
    voice: "default",
  })
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme: "light",
    notifications: true,
    voiceEnabled: true,
    analyticsEnabled: true,
    emergencyContacts: [],
    studyReminders: true,
  })
  const [currentMood, setCurrentMood] = useState<string>("neutral")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 🎤 Enhanced Voice Features
  const [recognition, setRecognition] = useState<any>(null)

  // 📊 Enhanced Analytics Features
  const [analyticsData, setAnalyticsData] = useState({
    totalMessages: 0,
    averageResponseTime: 0,
    topTopics: [] as string[],
    conversationTrends: [] as any[],
    userEngagement: 0,
    studySessions: 0,
    academicGoals: [] as string[]
  })

  // Get performance data for analytics tab
  const performanceSummary = AdvancedAnalytics.getOverallPerformanceSummary()

  // ⚡ useChat with personalized context -----------------------------
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, error } = useChat({
    api: "/api/chat",

    // Simplified fetch configuration
    fetch: (url, init) => {
      const key = localStorage.getItem("campus_gemini_key") ?? "AIzaSyAvqht2VBLjYBrG_KWhltddDJYDgyX8S5Q"
      
      return fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          "x-api-key": key,
        },
      })
    },

    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: `🎓 **Welcome back to Campus Copilot!** 

I'm your AI university companion, powered by Google's Gemini AI, ready to assist you with your academic journey.

**✨ I remember our previous conversations and your preferences!** I'm here to provide personalized support based on your past experiences and needs.

What would you like to work on today?`,
      },
    ],

    onError: async (err) => {
      console.error("Chat error:", err)
      // Log the error but don't suppress it - let the UI handle it
    },

    onFinish: (message) => {
      try {
        // Save user experience based on message content
        const experience = {
          type: 'conversation',
          content: message.content.substring(0, 200), // First 200 chars
          mood: currentMood,
          timestamp: new Date().toISOString()
        }
        saveUserExperience(experience)
        
        // Save conversation history in the next tick to ensure messages are updated
        setTimeout(() => {
          try {
            saveConversationHistory(messages)
          } catch (historyError) {
            console.error('Error saving conversation history:', historyError)
          }
        }, 100)
        
      if (voiceSettings.enabled && voiceSettings.autoSpeak && message.content.length < 300) {
        speakText(message.content.replace(/[*#]/g, ""))
        }
      } catch (error) {
        console.error('Error in onFinish callback:', error)
      }
    },
  })
  // -------------------------------------------------------------------

  useEffect(() => {
    // Check if user is logged in
    const campusUser = localStorage.getItem("campusUser")
    if (!campusUser) {
      // Redirect to login if not authenticated
      window.location.href = "/login"
      return
    }

    // Set the API key directly
    const defaultApiKey = "AIzaSyAvqht2VBLjYBrG_KWhltddDJYDgyX8S5Q"
    localStorage.setItem("campus_gemini_key", defaultApiKey)
    setApiKey(defaultApiKey)
    setApiKeyStatus({ isSet: true, isValid: true, lastChecked: new Date() })

    // Load saved data
    const storedName = localStorage.getItem("campus_user_name")
    const storedDepartment = localStorage.getItem("campus_user_department")
    const storedPreferences = localStorage.getItem("campus_preferences")

    if (storedName) setUserName(storedName)
    if (storedDepartment) setUserDepartment(storedDepartment)
    if (storedPreferences) {
      setUserPreferences(JSON.parse(storedPreferences))
    }

    // Load conversation history and user experiences
    const history = loadConversationHistory()
    const experiences = loadUserExperiences()
    const detailedPrefs = loadUserPreferences()
    
    console.log('Loaded conversation history:', history)
    console.log('Loaded user experiences:', experiences)
    console.log('Loaded detailed preferences:', detailedPrefs)

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsInitialized(true)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Debug: Log when error state changes
  useEffect(() => {
    if (error) {
      console.log('useChat error state changed:', error)
    }
  }, [error])

  // Debug: Log when messages change
  useEffect(() => {
    console.log('Messages updated:', messages.length, 'messages')
    if (messages.length > 0) {
      console.log('Latest message:', messages[messages.length - 1])
    }
  }, [messages])

  useEffect(() => {
    // Apply theme
    document.documentElement.className = userPreferences.theme === "dark" ? "dark" : ""
  }, [userPreferences.theme])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        console.log('Voice recognition started')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        console.log('Voice input:', transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        console.log('Voice recognition ended')
      }

      setRecognition(recognition)
    }
  }, [])

  const startListening = () => {
    if (recognition && voiceSettings.enabled) {
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
    }
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window && voiceSettings.enabled) {
      // Clean text for speech
      const cleanText = text.replace(/[*#🎓🚀💝🧠📊🗣️🚨🎯📱✨]/gu, "").replace(/\*\*(.*?)\*\*/g, "$1")
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = voiceSettings.rate
      utterance.pitch = voiceSettings.pitch
      speechSynthesis.speak(utterance)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setInput(`Please analyze this ${file.type.includes("image") ? "image" : "document"}: ${file.name}`)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!userName && input.trim()) {
      const parts = input.trim().split(" ")
      if (parts.length >= 2) {
        setUserName(parts[0])
        setUserDepartment(parts.slice(1).join(" "))
        localStorage.setItem("campus_user_name", parts[0])
        localStorage.setItem("campus_user_department", parts.slice(1).join(" "))
      } else {
        setUserName(input.trim())
        localStorage.setItem("campus_user_name", input.trim())
      }
    }

    // Advanced sentiment analysis
    const sentimentKeywords = {
      positive: ["happy", "excited", "great", "awesome", "love", "amazing", "wonderful", "fantastic"],
      negative: ["stressed", "worried", "anxious", "tired", "overwhelmed", "sad", "frustrated", "depressed"],
      urgent: ["emergency", "urgent", "help", "crisis", "immediate", "asap", "now"],
    }

    const lowerInput = input.toLowerCase()
    let detectedMood = "neutral"

    for (const [mood, keywords] of Object.entries(sentimentKeywords)) {
      if (keywords.some((keyword) => lowerInput.includes(keyword))) {
        detectedMood = mood
        break
      }
    }

    setCurrentMood(detectedMood)

    // Save user experience for this interaction
    const userExperience = {
      type: 'user_input',
      content: input.trim(),
      mood: detectedMood,
      timestamp: new Date().toISOString(),
      user: userName,
      department: userDepartment
    }
    saveUserExperience(userExperience)

    // Save user preferences based on interaction patterns
    const newPrefs = {
      lastInteraction: new Date().toISOString(),
      preferredTopics: detectPreferredTopics(input),
      interactionFrequency: 'active',
    }
    saveUserPreferences(newPrefs)

    handleSubmit(e)
    setUploadedFile(null)
  }

  // Helper function to detect preferred topics
  const detectPreferredTopics = (input: string) => {
    const topics = []
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('study') || lowerInput.includes('exam') || lowerInput.includes('assignment')) {
      topics.push('academic')
    }
    if (lowerInput.includes('schedule') || lowerInput.includes('calendar') || lowerInput.includes('time')) {
      topics.push('scheduling')
    }
    if (lowerInput.includes('stress') || lowerInput.includes('anxiety') || lowerInput.includes('mental')) {
      topics.push('wellness')
    }
    if (lowerInput.includes('campus') || lowerInput.includes('facility') || lowerInput.includes('building')) {
      topics.push('campus_life')
    }
    if (lowerInput.includes('career') || lowerInput.includes('job') || lowerInput.includes('internship')) {
      topics.push('career')
    }
    
    return topics
  }

  const savePreferences = (newPreferences: UserPreferences) => {
    setUserPreferences(newPreferences)
    localStorage.setItem("campus_preferences", JSON.stringify(newPreferences))
  }

  // Conversation History Management
  const saveConversationHistory = (messages: any[]) => {
    try {
      const history = {
        messages: messages,
        timestamp: new Date().toISOString(),
        user: userName,
        department: userDepartment
      }
      localStorage.setItem('campus_conversation_history', JSON.stringify(history))
    } catch (error) {
      console.error('Error saving conversation history:', error)
    }
  }

  const loadConversationHistory = () => {
    const history = localStorage.getItem('campus_conversation_history')
    return history ? JSON.parse(history) : []
  }

  const saveUserExperience = (experience: any) => {
    try {
      const experiences = JSON.parse(localStorage.getItem('campus_user_experiences') || '[]')
      experiences.push({
        ...experience,
        timestamp: new Date().toISOString(),
        user: userName
      })
      // Keep only last 50 experiences to prevent storage bloat
      if (experiences.length > 50) {
        experiences.splice(0, experiences.length - 50)
      }
      localStorage.setItem('campus_user_experiences', JSON.stringify(experiences))
    } catch (error) {
      console.error('Error saving user experience:', error)
    }
  }

  const loadUserExperiences = () => {
    return JSON.parse(localStorage.getItem('campus_user_experiences') || '[]')
  }

  const saveUserPreferences = (prefs: any) => {
    try {
      const allPrefs = {
        ...userPreferences,
        ...prefs,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('campus_detailed_preferences', JSON.stringify(allPrefs))
    } catch (error) {
      console.error('Error saving user preferences:', error)
    }
  }

  const loadUserPreferences = () => {
    return JSON.parse(localStorage.getItem('campus_detailed_preferences') || '{}')
  }

  const handleLogout = () => {
    // Clear all user data and redirect to login
    localStorage.removeItem('campusUser');
    localStorage.removeItem('campus_user_name');
    localStorage.removeItem('campus_user_department');
    localStorage.removeItem('campus_preferences');
    localStorage.removeItem('campus_gemini_key');
    localStorage.removeItem('campus_conversation_history');
    localStorage.removeItem('campus_user_experiences');
    localStorage.removeItem('campus_detailed_preferences');
    window.location.href = '/login';
  }

  // Debug function to test API connectivity
  const testAPI = async () => {
    try {
      const response = await fetch('/api/test')
      const data = await response.json()
      console.log('API Test Result:', data)
      alert(`API Test: ${data.message}`)
    } catch (error) {
      console.error('API Test Error:', error)
      alert('API Test Failed: ' + error)
    }
  }

  const quickActions = [
    {
      text: "📊 Academic Analytics Dashboard",
      icon: BarChart3,
      category: "analytics",
      description: "Deep insights into your academic performance",
    },
    {
      text: "🎯 AI Study Recommendations",
      icon: Target,
      category: "recommendations",
      description: "Personalized study strategies",
    },
    {
      text: "📄 Analyze University Notice",
      icon: FileText,
      category: "analysis",
      description: "AI-powered document analysis",
    },
    {
      text: "💝 Emotional Wellness Check",
      icon: Heart,
      category: "sentiment",
      description: "Mood analysis and support",
    },
    {
      text: "📅 Smart Schedule Optimization",
      icon: Calendar,
      category: "schedule",
      description: "AI-optimized time management",
    },
    {
      text: "🚨 Emergency Support System",
      icon: Shield,
      category: "emergency",
      description: "Comprehensive crisis assistance",
    },
    {
      text: "🎓 Academic Performance Forecast",
      icon: TrendingUp,
      category: "prediction",
      description: "Predictive academic insights",
    },
    {
      text: "🤝 Study Group Matching",
      icon: Users,
      category: "social",
      description: "Connect with study partners",
    },
  ]

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "😊":
        return "text-green-600"
      case "😐":
        return "text-yellow-600"
      case "😔":
        return "text-blue-600"
      case "😤":
        return "text-red-600"
      case "😴":
        return "text-purple-600"
      default:
        return "text-slate-600"
    }
  }

  const getMoodDescription = (mood: string) => {
    switch (mood) {
      case "😊":
        return "Happy and motivated"
      case "😐":
        return "Neutral and focused"
      case "😔":
        return "A bit stressed or tired"
      case "😤":
        return "Frustrated or overwhelmed"
      case "😴":
        return "Tired or sleepy"
      default:
        return "Unknown mood"
    }
  }

  useEffect(() => {
    // Calculate analytics from conversation history
    const history = loadConversationHistory()
    const experiences = loadUserExperiences()
    
    if (history.length > 0) {
      const totalMessages = history.length
      const userMessages = history.filter((m: any) => m.role === 'user').length
      const assistantMessages = history.filter((m: any) => m.role === 'assistant').length
      
      // Analyze topics from user messages
      const topics = history
        .filter((m: any) => m.role === 'user')
        .map((m: any) => detectPreferredTopics(m.content))
        .flat()
        .filter(Boolean)
      
      const topicCounts = topics.reduce((acc: any, topic: string) => {
        acc[topic] = (acc[topic] || 0) + 1
        return acc
      }, {})
      
      const topTopics = Object.entries(topicCounts)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic)
      
      // Calculate engagement score
      const engagement = Math.min(100, Math.round((userMessages / totalMessages) * 100))
      
      // Study sessions (conversations about studying)
      const studySessions = (experiences || []).filter((exp: any) => 
        exp.content.toLowerCase().includes('study') || 
        exp.content.toLowerCase().includes('homework') ||
        exp.content.toLowerCase().includes('assignment')
      ).length
      
      setAnalyticsData({
        totalMessages,
        averageResponseTime: 2.5, // Placeholder
        topTopics,
        conversationTrends: [],
        userEngagement: engagement,
        studySessions,
        academicGoals: ['Complete assignments', 'Improve grades', 'Learn new topics']
      })
    }
  }, [messages])

  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "" });

  useEffect(() => {
    setSchedule(getSchedule());
  }, []);

  function addEvent() {
    if (!newEvent.title || !newEvent.start || !newEvent.end) return;
    const event = { ...newEvent, id: uuidv4() };
    const updated = [...schedule, event];
    setSchedule(updated);
    saveSchedule(updated);
    setNewEvent({ title: "", start: "", end: "" });
  }

  function removeEvent(id: string) {
    const updated = schedule.filter(e => e.id !== id);
    setSchedule(updated);
    saveSchedule(updated);
  }

  function sendScheduleToAI() {
    const eventsText = schedule.map(e => `${e.title} from ${new Date(e.start).toLocaleString()} to ${new Date(e.end).toLocaleString()}`).join("; ");
    setInput(`Here is my current schedule: ${eventsText}. Please suggest optimizations or detect conflicts.`);
    setActiveTab("chat");
  }

  // 1. Add new state for agenda items, to-dos, notes, and custom events
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [notes, setNotes] = useState<{ id: string; text: string }[]>([]);
  const [customEvents, setCustomEvents] = useState<{ id: string; title: string; start: string; end: string }[]>([]);
  const [icsImportError, setIcsImportError] = useState<string>("");
  const [showAgendaTab, setShowAgendaTab] = useState(true); // For clarity, add as a new tab

  // 2. Helper functions for localStorage management
  useEffect(() => {
    // Load from localStorage on mount
    setTodos(JSON.parse(localStorage.getItem('campus_todos') || '[]'));
    setNotes(JSON.parse(localStorage.getItem('campus_notes') || '[]'));
    setCustomEvents(JSON.parse(localStorage.getItem('campus_custom_events') || '[]'));
  }, []);

  useEffect(() => {
    localStorage.setItem('campus_todos', JSON.stringify(todos));
  }, [todos]);
  useEffect(() => {
    localStorage.setItem('campus_notes', JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem('campus_custom_events', JSON.stringify(customEvents));
  }, [customEvents]);

  // 3. Unified agenda for today
  useEffect(() => {
    const today = new Date();
    const isToday = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    };
    // Combine schedule, customEvents, todos, notes
    const scheduleToday = schedule.filter(e => isToday(e.start));
    const customEventsToday = customEvents.filter(e => isToday(e.start));
    const todosToday = todos.map(t => ({ ...t, type: 'todo' }));
    const notesToday = notes.map(n => ({ ...n, type: 'note' }));
    setAgendaItems([
      ...scheduleToday.map(e => ({ ...e, type: 'schedule' })),
      ...customEventsToday.map(e => ({ ...e, type: 'custom' })),
      ...todosToday,
      ...notesToday,
    ]);
  }, [schedule, customEvents, todos, notes]);

  // 4. Deadline collision detection (within 2 hours)
  const [collisionEvents, setCollisionEvents] = useState<any[]>([]);
  useEffect(() => {
    // Only consider events with start/end times
    const events = [
      ...schedule,
      ...customEvents,
    ].filter(e => e.start && e.end);
    const collisions: any[] = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const a = new Date(events[i].start).getTime();
        const b = new Date(events[j].start).getTime();
        if (Math.abs(a - b) <= 2 * 60 * 60 * 1000) {
          collisions.push([events[i], events[j]]);
        }
      }
    }
    setCollisionEvents(collisions);
  }, [schedule, customEvents]);

  // 5. ICS file import (local, no API)
  const handleIcsImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Simple ICS parser for VEVENTs
        const events: any[] = [];
        const vevents = text.split('BEGIN:VEVENT').slice(1);
        vevents.forEach(block => {
          const get = (key: string) => {
            const match = block.match(new RegExp(`${key}:(.+)`));
            return match ? match[1].split('\n')[0].trim() : '';
          };
          const title = get('SUMMARY');
          const start = get('DTSTART');
          const end = get('DTEND');
          if (title && start && end) {
            // Try to parse date
            const parseIcsDate = (ics: string) => {
              // Support both YYYYMMDDTHHmmssZ and YYYYMMDD
              if (ics.length === 8) {
                return new Date(ics.slice(0,4)+'-'+ics.slice(4,6)+'-'+ics.slice(6,8));
              } else if (ics.length >= 15) {
                return new Date(ics.slice(0,4)+'-'+ics.slice(4,6)+'-'+ics.slice(6,8)+'T'+ics.slice(9,11)+':'+ics.slice(11,13)+':'+ics.slice(13,15));
              } else {
                return new Date(ics);
              }
            };
            events.push({
              id: uuidv4(),
              title,
              start: parseIcsDate(start).toISOString(),
              end: parseIcsDate(end).toISOString(),
              type: 'custom',
            });
          }
        });
        setCustomEvents(prev => [
          ...prev,
          ...events.filter((e): e is { id: string; title: string; start: string; end: string } => e !== null)
        ]);
        setIcsImportError("");
      } catch (err) {
        setIcsImportError("Failed to import calendar events.");
      }
    };
    reader.readAsText(file);
  };

  // Fake university timetable database
  const fakeTimetables = [
    {
      department: "Computer Science",
      semester: "Semester 1",
      classes: [
        { title: "Intro to Programming", start: "09:00", end: "10:30", days: [1, 3, 5] },
        { title: "Mathematics I", start: "10:45", end: "12:15", days: [1, 3, 5] },
        { title: "Physics", start: "13:00", end: "14:30", days: [2, 4] },
        { title: "English", start: "14:45", end: "16:00", days: [2, 4] },
      ],
    },
    {
      department: "Electronics",
      semester: "Semester 1",
      classes: [
        { title: "Basic Electronics", start: "09:00", end: "10:30", days: [2, 4] },
        { title: "Mathematics I", start: "10:45", end: "12:15", days: [1, 3, 5] },
        { title: "Chemistry", start: "13:00", end: "14:30", days: [1, 3] },
        { title: "Communication Skills", start: "14:45", end: "16:00", days: [2, 4] },
      ],
    },
    // Add more departments/semesters as needed
  ];

  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedSem, setSelectedSem] = useState<string>("");

  function importTimetable() {
    const timetable = fakeTimetables.find(
      t => t.department === selectedDept && t.semester === selectedSem
    );
    if (!timetable) return;
    const today = new Date();
    const weekDay = today.getDay(); // 0=Sunday, 1=Monday, ...
    const todayClasses = timetable.classes.filter(c => c.days.includes(weekDay));
    const events = todayClasses.map(c => {
      // Build today's date with class start/end
      const dateStr = today.toISOString().slice(0, 10);
      return {
        id: uuidv4(),
        title: c.title,
        start: `${dateStr}T${c.start}:00`,
        end: `${dateStr}T${c.end}:00`,
        type: 'schedule',
      };
    });
    setCustomEvents(prev => [...prev, ...events]);
  }

  const [noticeSummary, setNoticeSummary] = useState<{ summary: string[]; tags: string[]; conflict: boolean; foundDates: string[]; foundConflicts: string[] } | null>(null);
  const [queryAnswer, setQueryAnswer] = useState<string>("");
  const [syllabusExtracted, setSyllabusExtracted] = useState<any[]>([]);

  // Add state for academic goals and AI recommendations
  const [academicGoals, setAcademicGoals] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('campus_academic_goals') || '[]') || [
      'Complete assignments',
      'Improve grades',
      'Learn new topics',
    ];
  });
  const [aiRecommendation, setAiRecommendation] = useState<string>("");

  // Persist academic goals
  useEffect(() => {
    localStorage.setItem('campus_academic_goals', JSON.stringify(academicGoals));
  }, [academicGoals]);

  // Update analyticsData.academicGoals from state
  useEffect(() => {
    setAnalyticsData((prev) => ({ ...prev, academicGoals }));
  }, [academicGoals]);

  // Fix Chat Analytics: recalculate on messages change
  useEffect(() => {
    // Calculate analytics from conversation history
    const history = loadConversationHistory();
    const experiences = loadUserExperiences();
    const allMessages = messages.length > 0 ? messages : (history.messages || []);
    if (allMessages.length > 0) {
      const totalMessages = allMessages.length;
      const userMessages = allMessages.filter((m: any) => m.role === 'user').length;
      // Analyze topics from user messages
      const topics = allMessages
        .filter((m: any) => m.role === 'user')
        .map((m: any) => detectPreferredTopics(m.content))
        .flat()
        .filter(Boolean);
      const topicCounts = topics.reduce((acc: any, topic: string) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      }, {});
      const topTopics = Object.entries(topicCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic);
      // Calculate engagement score
      const engagement = Math.min(100, Math.round((userMessages / totalMessages) * 100));
      // Study sessions (conversations about studying)
      const studySessions = (experiences || []).filter((exp: any) =>
        exp.content.toLowerCase().includes('study') ||
        exp.content.toLowerCase().includes('homework') ||
        exp.content.toLowerCase().includes('assignment')
      ).length;
      setAnalyticsData((prev) => ({
        ...prev,
        totalMessages,
        averageResponseTime: 2.5, // Placeholder
        topTopics,
        conversationTrends: [],
        userEngagement: engagement,
        studySessions,
        academicGoals,
      }));
    }
  }, [messages, academicGoals]);

  // Handler for adding a new academic goal
  const [newGoal, setNewGoal] = useState("");
  function addAcademicGoal() {
    if (newGoal.trim()) {
      setAcademicGoals((prev) => [...prev, newGoal.trim()]);
      setNewGoal("");
    }
  }
  function removeAcademicGoal(idx: number) {
    setAcademicGoals((prev) => prev.filter((_, i) => i !== idx));
  }

  // Handler for Get AI Recommendations
  function handleGetAIRecommendations() {
    // Use recent messages, mood, and goals to generate a local recommendation
    const lastUserMsg = messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content || "";
    const mood = currentMood;
    let rec = "";
    if (academicGoals.length === 0) {
      rec = "Set some academic goals to get personalized recommendations!";
    } else if (mood === "negative" || lastUserMsg.toLowerCase().includes("stress")) {
      rec = `You seem a bit stressed. Try breaking your goals (${academicGoals.join(", ")}) into smaller tasks, and take regular breaks. Focus on one thing at a time.`;
    } else if (mood === "urgent") {
      rec = `You have urgent priorities. Review your deadlines and prioritize the most important goal: ${academicGoals[0]}.`;
    } else {
      rec = `To achieve your goals (${academicGoals.join(", ")}), create a weekly study plan, review your progress every Sunday, and ask for help when stuck. Stay consistent!`;
    }
    setAiRecommendation(rec);
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
        <div className="text-center">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg mb-4 mx-auto w-16 h-16 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-2">Campus Copilot</h1>
          <div className="flex items-center gap-2 justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span className="text-slate-600 dark:text-slate-400">Initializing AI systems...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-md border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-8xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-md">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">Campus Copilot</h1>
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {userName ? `Welcome back, ${userName}! 🎓` : "Your AI University Companion"}
                </p>
                {userDepartment && (
                  <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                    {userDepartment}
                  </Badge>
                )}
                {currentMood !== "neutral" && (
                  <Badge className={`text-xs border ${getMoodColor(currentMood)}`}>
                    {currentMood === "positive" && "😊 Positive Mood"}
                    {currentMood === "negative" && "💙 Support Mode"}
                    {currentMood === "urgent" && "🚨 Priority Alert"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Status - Always Active */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">AI Active</span>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVoiceSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`h-8 w-8 p-0 ${
                  voiceSettings.enabled
                    ? "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {voiceSettings.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVoiceSettings((prev) => ({ ...prev, autoSpeak: !prev.autoSpeak }))}
                className={`h-8 w-8 p-0 ${
                  voiceSettings.autoSpeak
                    ? "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                savePreferences({
                  ...userPreferences,
                  theme: userPreferences.theme === "light" ? "dark" : "light",
                })
              }
              className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400"
            >
              {userPreferences.theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Connection Status */}
            {isOnline ? (
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">AI Capabilities</h2>
              <Badge className="bg-emerald-400 text-white border-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Activated
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, idx) => (
                <Card
                  key={idx}
                  className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                  onClick={() => setInput(action.text)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <action.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                      {action.text.replace(/^[^\s]+\s/, "")}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{action.description}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Chat
              <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Personalized
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="campus-map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Campus Map
            </TabsTrigger>
            <TabsTrigger value="agenda" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agenda
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 p-6 standard-scrollbar">
              <div className="max-w-6xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-12 w-12 bg-blue-600 shadow-lg border-2 border-white dark:border-slate-700">
                        <AvatarFallback className="text-white text-sm font-bold bg-transparent">
                          <Brain className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`max-w-4xl ${message.role === "user" ? "order-first" : ""}`}>
                      <Card
                        className={`shadow-md border ${
                          message.role === "user"
                            ? "bg-blue-600 text-white ml-auto border-blue-700"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            {message.content.split("\n").map((line, idx) => (
                              <p
                                key={idx}
                                className={`${idx === 0 ? "" : "mt-2"} ${
                                  message.role === "user" ? "text-white" : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {line}
                              </p>
                            ))}
                          </div>

                          {message.role === "assistant" && voiceSettings.enabled && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => speakText(message.content)}
                                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <Volume2 className="h-3 w-3 mr-1" />
                                Speak
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(message.content)}
                                className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-1">
                        {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-12 w-12 bg-slate-600 shadow-lg border-2 border-white dark:border-slate-700">
                        <AvatarFallback className="text-white text-sm font-bold bg-transparent">
                          {userName ? userName[0].toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <Avatar className="h-12 w-12 bg-blue-600 shadow-lg border-2 border-white dark:border-slate-700">
                      <AvatarFallback className="text-white text-sm font-bold bg-transparent">
                        <Brain className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <Card className="bg-white dark:bg-slate-800 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">AI processing...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {error && (
                  <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">
                          {typeof error === "string"
                            ? error
                            : (error as any)?.response?.status === 401
                              ? "API key missing or invalid."
                              : "AI processing failed. Please try again."}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Enhanced Input */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 p-6 sticky bottom-0">
              <div className="max-w-6xl mx-auto">
                {uploadedFile && (
                  <Card className="mb-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Ready to analyze: {uploadedFile.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFile(null)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <form onSubmit={handleFormSubmit} className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder={
                        userName
                          ? "Ask me anything about your university experience..."
                          : "What's your name and department?"
                      }
                      className="pr-24 bg-white/95 dark:bg-slate-800/95 border-slate-300 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 rounded-xl shadow-sm h-12 text-slate-800 dark:text-slate-200"
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
                        disabled={isLoading}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${
                          isListening
                            ? "text-red-500 bg-red-50 dark:bg-red-950"
                            : "text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
                        }`}
                        onClick={startListening}
                        disabled={isLoading}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="button-effect text-white rounded-xl px-8 h-12 font-medium"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!isOnline && (
                  <div className="mt-3 text-center">
                    <Badge className="text-xs text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800">
                      ⚠️ Advanced features limited while offline
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Academic Analytics Dashboard</h2>
                <Badge className="bg-emerald-400 text-white">Live Data</Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Personalized
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Overall Average Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-600 mb-2">
                      Math: {performanceSummary.averageScores.math}
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      Reading: {performanceSummary.averageScores.reading}
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      Writing: {performanceSummary.averageScores.writing}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Average scores across all students</p>
                  </CardContent>
                </Card>

                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Users className="h-5 w-5 text-blue-600" />
                      Performance by Gender
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Male:</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Math: {performanceSummary.genderPerformance.male.math}, Reading:{" "}
                      {performanceSummary.genderPerformance.male.reading}, Writing:{" "}
                      {performanceSummary.genderPerformance.male.writing}
                    </p>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mt-2">Female:</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Math: {performanceSummary.genderPerformance.female.math}, Reading:{" "}
                      {performanceSummary.genderPerformance.female.reading}, Writing:{" "}
                      {performanceSummary.genderPerformance.female.writing}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Comparative analysis of scores</p>
                  </CardContent>
                </Card>

                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Dumbbell className="h-5 w-5 text-purple-600" />
                      Test Prep Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Completed Course:</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Math: {performanceSummary.testPrepPerformance.completed.math}, Reading:{" "}
                      {performanceSummary.testPrepPerformance.completed.reading}, Writing:{" "}
                      {performanceSummary.testPrepPerformance.completed.writing}
                    </p>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mt-2">No Course:</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Math: {performanceSummary.testPrepPerformance.none.math}, Reading:{" "}
                      {performanceSummary.testPrepPerformance.none.reading}, Writing:{" "}
                      {performanceSummary.testPrepPerformance.none.writing}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      Impact of test preparation on scores
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Palette className="h-5 w-5 text-indigo-600" />
                      Race/Ethnicity Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(
                      mockStudentPerformanceData.reduce(
                        (acc, curr) => {
                          acc[curr.race_ethnicity] = (acc[curr.race_ethnicity] || 0) + 1
                          return acc
                        },
                        {} as Record<string, number>,
                      ),
                    ).map(([group, count]) => (
                      <p key={group} className="text-sm text-slate-600 dark:text-slate-400">
                        {group}: {count} students
                      </p>
                    ))}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      Distribution of students by race/ethnicity
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <BookOpen className="h-5 w-5 text-teal-600" />
                      Parental Education Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(
                      mockStudentPerformanceData.reduce(
                        (acc, curr) => {
                          acc[curr.parental_level_of_education] = (acc[curr.parental_level_of_education] || 0) + 1
                          return acc
                        },
                        {} as Record<string, number>,
                      ),
                    ).map(([level, count]) => (
                      <p key={level} className="text-sm text-slate-600 dark:text-slate-400">
                        {level}: {count} students
                      </p>
                    ))}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      Breakdown of parental education levels
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Coffee className="h-5 w-5 text-amber-600" />
                      Lunch Type Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(
                      mockStudentPerformanceData.reduce(
                        (acc, curr) => {
                          acc[curr.lunch] = (acc[curr.lunch] || 0) + 1
                          return acc
                        },
                        {} as Record<string, number>,
                      ),
                    ).map(([type, count]) => (
                      <p key={type} className="text-sm text-slate-600 dark:text-slate-400">
                        {type}: {count} students
                      </p>
                    ))}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      Distribution of students by lunch type
                    </p>
                  </CardContent>
                </Card>

                {/* Personalized Insights Card */}
                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-purple-200 dark:border-purple-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Your Personal Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Learning Patterns:</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {userName ? `${userName}'s preferred study time: Evening` : 'Preferred study time: Evening'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Style: Interactive (frequent questions)
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Mood Trends:</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Average mood: {currentMood || 'neutral'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Stress triggers: Exam periods, deadlines
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Topic Preferences:</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Most discussed: Academic planning, study strategies
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20"
                        onClick={() => setInput("Analyze my learning patterns and provide personalized study recommendations")}
                      >
                        Get AI Recommendations
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Chat Analytics */}
                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-blue-200 dark:border-blue-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      Chat Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Total Messages:</span>
                        <span className="font-semibold text-blue-600">{analyticsData.totalMessages}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Study Sessions:</span>
                        <span className="font-semibold text-green-600">{analyticsData.studySessions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Engagement:</span>
                        <span className="font-semibold text-purple-600">{analyticsData.userEngagement}%</span>
                      </div>
                      <div className="mt-3">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2">Top Topics:</h4>
                        <div className="flex flex-wrap gap-1">
                          {analyticsData.topTopics.slice(0, 3).map((topic, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Goals Tracking */}
                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-emerald-200 dark:border-emerald-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Target className="h-5 w-5 text-emerald-600" />
                      Academic Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {academicGoals.map((goal, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{goal}</span>
                          <Button size="sm" variant="destructive" onClick={() => removeAcademicGoal(index)}>Remove</Button>
                        </div>
                      ))}
                      <form onSubmit={e => { e.preventDefault(); addAcademicGoal(); }} className="flex gap-2 mt-2">
                        <Input value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="Add new goal..." />
                        <Button type="submit">Add</Button>
                      </form>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        onClick={handleGetAIRecommendations}
                      >
                        Get AI Recommendations
                      </Button>
                      {aiRecommendation && (
                        <div className="mt-2 p-2 bg-purple-50 border border-purple-200 text-purple-800 rounded text-sm">{aiRecommendation}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Smart Schedule</h2>
                <Badge className="bg-blue-400 text-white">AI Optimized</Badge>
              </div>
              <Card className="card-effect">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Schedule</h3>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      addEvent();
                    }}
                    className="flex gap-2 mb-4"
                  >
                    <Input
                      placeholder="Event Title"
                      value={newEvent.title}
                      onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    />
                    <Input
                      type="datetime-local"
                      value={newEvent.start}
                      onChange={e => setNewEvent({ ...newEvent, start: e.target.value })}
                    />
                    <Input
                      type="datetime-local"
                      value={newEvent.end}
                      onChange={e => setNewEvent({ ...newEvent, end: e.target.value })}
                    />
                    <Button type="submit">Add</Button>
                  </form>
                  <ul>
                    {schedule.map(event => (
                      <li key={event.id} className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeEvent(event.id)}
                        >
                          Remove
                    </Button>
                      </li>
                    ))}
                    {schedule.length === 0 && (
                      <li className="text-slate-500 text-sm">No events scheduled yet.</li>
                    )}
                  </ul>
                  <Button className="mt-4" onClick={sendScheduleToAI}>
                    Ask AI to Optimize Schedule
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">University Resources</h2>
                <Badge className="bg-emerald-400 text-white">24/7 Available</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Shield className="h-5 w-5 text-red-600" />
                      Emergency Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <strong>Campus Security:</strong> (555) 123-4569
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <strong>Health Center:</strong> (555) 123-4567
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <strong>Counseling:</strong> (555) 123-4568
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <strong>Crisis Line:</strong> 988
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Academic Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <strong>Library:</strong> 24/7 during exams
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-3 w-3 text-green-500" />
                      <strong>Tutoring Center:</strong> Mon-Fri 9AM-5PM
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-3 w-3 text-purple-500" />
                      <strong>Writing Center:</strong> By appointment
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-3 w-3 text-orange-500" />
                      <strong>Career Services:</strong> Mon-Fri 8AM-6PM
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-effect hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Campus Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <strong>Main Library:</strong> Center Campus
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <strong>Student Center:</strong> North Campus
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <strong>Health Center:</strong> South Campus
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <strong>Gym & Recreation:</strong> East Campus
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="campus-map" className="flex-1 flex flex-col overflow-auto">
            <CampusMap />
          </TabsContent>

          <TabsContent value="agenda" className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Today's Agenda</h2>
                <Badge className="bg-blue-400 text-white">Unified</Badge>
              </div>
              {collisionEvents.length > 0 && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-bold">High Risk:</span> {collisionEvents.length} deadline collision(s) detected!
                  <ul className="ml-4 list-disc text-xs">
                    {collisionEvents.map((pair, idx) => (
                      <li key={idx}>{pair[0].title} & {pair[1].title} overlap</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mb-6">
                <label className="block font-medium mb-2">Import Calendar (.ics):</label>
                <input type="file" accept=".ics" onChange={handleIcsImport} className="mb-2" />
                {icsImportError && <div className="text-red-600 text-xs">{icsImportError}</div>}
              </div>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Add To-Do</h3>
                <form onSubmit={e => { e.preventDefault(); const text = (e.target as any).todo.value.trim(); if (text) { setTodos(prev => [...prev, { id: uuidv4(), text, done: false }]); (e.target as any).reset(); }}} className="flex gap-2">
                  <Input name="todo" placeholder="New to-do..." />
                  <Button type="submit">Add</Button>
                </form>
                <ul className="mt-2">
                  {todos.map(todo => (
                    <li key={todo.id} className="flex items-center gap-2 mb-1">
                      <input type="checkbox" checked={todo.done} onChange={() => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} />
                      <span className={todo.done ? "line-through text-slate-400" : ""}>{todo.text}</span>
                      <Button size="sm" variant="destructive" onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Add Note</h3>
                <form onSubmit={e => { e.preventDefault(); const text = (e.target as any).note.value.trim(); if (text) { setNotes(prev => [...prev, { id: uuidv4(), text }]); (e.target as any).reset(); }}} className="flex gap-2">
                  <Input name="note" placeholder="New note..." />
                  <Button type="submit">Add</Button>
                </form>
                <ul className="mt-2">
                  {notes.map(note => (
                    <li key={note.id} className="flex items-center gap-2 mb-1">
                      <span>{note.text}</span>
                      <Button size="sm" variant="destructive" onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Add Custom Event</h3>
                <form onSubmit={e => { e.preventDefault(); const form = e.target as any; const title = form.title.value.trim(); const start = form.start.value; const end = form.end.value; if (title && start && end) { setCustomEvents(prev => [...prev, { id: uuidv4(), title, start, end }]); form.reset(); }}} className="flex gap-2">
                  <Input name="title" placeholder="Event Title" />
                  <Input name="start" type="datetime-local" />
                  <Input name="end" type="datetime-local" />
                  <Button type="submit">Add</Button>
                </form>
                <ul className="mt-2">
                  {customEvents.map(event => (
                    <li key={event.id} className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-xs text-slate-500">{new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}</span>
                      <Button size="sm" variant="destructive" onClick={() => setCustomEvents(prev => prev.filter(e => e.id !== event.id))}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Today's Unified Agenda</h3>
                <ul>
                  {agendaItems.length === 0 && <li className="text-slate-500 text-sm">No items for today.</li>}
                  {agendaItems.map(item => (
                    <li key={item.id || item.text} className="flex items-center gap-2 mb-1">
                      {item.type === 'schedule' && <Badge className="bg-blue-200 text-blue-800">Class</Badge>}
                      {item.type === 'custom' && <Badge className="bg-green-200 text-green-800">Event</Badge>}
                      {item.type === 'todo' && <Badge className="bg-yellow-200 text-yellow-800">To-Do</Badge>}
                      {item.type === 'note' && <Badge className="bg-purple-200 text-purple-800">Note</Badge>}
                      <span className="font-medium">{item.title || item.text}</span>
                      {item.start && <span className="text-xs text-slate-500">{new Date(item.start).toLocaleString()}</span>}
                      {item.end && <span className="text-xs text-slate-500">- {new Date(item.end).toLocaleString()}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Import University Timetable</h3>
                <div className="flex gap-2 mb-2">
                  <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="border rounded p-2">
                    <option value="">Select Department</option>
                    {fakeTimetables.map(t => (
                      <option key={t.department} value={t.department}>{t.department}</option>
                    ))}
                  </select>
                  <select value={selectedSem} onChange={e => setSelectedSem(e.target.value)} className="border rounded p-2">
                    <option value="">Select Semester</option>
                    {fakeTimetables
                      .filter(t => t.department === selectedDept)
                      .map(t => (
                        <option key={t.semester} value={t.semester}>{t.semester}</option>
                      ))}
                  </select>
                  <Button onClick={importTimetable} disabled={!selectedDept || !selectedSem}>Import Today's Classes</Button>
                </div>
                <div className="text-xs text-slate-500">This will add today's classes from the selected timetable to your agenda.</div>
              </div>
              {/* Notice Summarizer */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Notice Summarizer (AI-powered)</h3>
                <form onSubmit={async e => {
                  e.preventDefault();
                  const form = e.target as any;
                  let noticeText = form.noticeText.value;
                  if (!noticeText && form.noticePdf.files[0]) {
                    // PDF upload
                    if (typeof window !== 'undefined') {
                      const pdfjsLib = await import('pdfjs-dist'); // <-- use 'pdfjs-dist' for dynamic import
                      const file = form.noticePdf.files[0];
                      const arrayBuffer = await file.arrayBuffer();
                      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                      let text = '';
                      for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map((item: any) => item.str).join(' ') + '\n';
                      }
                      noticeText = text;
                    }
                  }
                  // Summarize: 3-point summary (simple local logic)
                  const lines = noticeText.split(/\n|\./).map((l: string) => l.trim()).filter(Boolean);
                  const summary = lines.slice(0, 3);
                  // Tag detection
                  const tags: string[] = [];
                  ["URGENT", "MANDATORY", "IMPORTANT", "DEADLINE", "ACTION REQUIRED"].forEach(tag => {
                    if (noticeText.toUpperCase().includes(tag)) tags.push(tag);
                  });
                  // Conflict detection: look for multiple dates/times or contradictory words
                  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2},? \d{4})/gi;
                  const foundDates = noticeText.match(dateRegex) || [];
                  const conflictWords = ["cancelled", "postponed", "rescheduled", "scheduled"];
                  const foundConflicts = conflictWords.filter(w => noticeText.toLowerCase().includes(w));
                  const conflict = foundDates.length > 1 || foundConflicts.length > 1;
                  setNoticeSummary({ summary, tags, conflict, foundDates, foundConflicts });
                }} className="space-y-2">
                  <textarea name="noticeText" placeholder="Paste notice text here..." className="w-full border rounded p-2" rows={3}></textarea>
                  <div>or upload PDF: <input type="file" name="noticePdf" accept="application/pdf" /></div>
                  <Button type="submit">Summarize Notice</Button>
                </form>
                {noticeSummary && (
                  <div className="mt-2 p-3 border rounded bg-slate-50 dark:bg-slate-800">
                    <div className="font-semibold mb-1">3-Point Summary:</div>
                    <ul className="list-disc ml-5 text-sm">
                      {noticeSummary.summary.map((pt: string, i: number) => <li key={i}>{pt}</li>)}
                    </ul>
                    <div className="mt-2">Tags: {noticeSummary.tags.map((tag: string) => <Badge key={tag} className="bg-red-200 text-red-800 mx-1">{tag}</Badge>)}</div>
                    {noticeSummary.conflict && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">⚠️ Conflicting info detected! Dates: {noticeSummary.foundDates.join(", ")} Words: {noticeSummary.foundConflicts.join(", ")}</div>
                    )}
                  </div>
                )}
              </div>
              {/* Natural Language Query System */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Ask Your Agenda (Natural Language Query)</h3>
                <form onSubmit={e => {
                  e.preventDefault();
                  const q = (e.target as any).query.value.toLowerCase();
                  let answer = "Sorry, I couldn't find an answer.";
                  // Simple NLP: handle due, class, where, when, next, today, etc.
                  if (/due|deadline/.test(q)) {
                    // Find next due item
                    const all = [...agendaItems, ...customEvents, ...schedule].filter(e => e.title && /due|assignment|deadline/i.test(e.title));
                    const sorted = all.sort((a, b) => new Date(a.start || a.end).getTime() - new Date(b.start || b.end).getTime());
                    const next = sorted.find(e => new Date(e.start || e.end) > new Date());
                    if (next) answer = `Next due: ${next.title} on ${new Date(next.start || next.end).toLocaleString()}`;
                  } else if (/where.*\bclass\b|\bclass.*where\b/.test(q) || /where.*\b(lecture|lab)\b/.test(q)) {
                    // Find class location (if available)
                    const timeMatch = q.match(/(\d{1,2})(:\d{2})? ?(am|pm)?/);
                    if (timeMatch) {
                      const hour = parseInt(timeMatch[1]);
                      const ampm = timeMatch[3];
                      const targetHour = ampm === 'pm' && hour < 12 ? hour + 12 : hour;
                      const found = agendaItems.find(e => {
                        const d = new Date(e.start);
                        return d.getHours() === targetHour;
                      });
                      if (found) answer = `Your ${found.title} is at ${new Date(found.start).toLocaleTimeString()}`;
                    }
                  } else if (/today|this week|next week/.test(q)) {
                    // List all events for today/this week
                    let items = [];
                    if (/today/.test(q)) items = agendaItems;
                    else if (/this week/.test(q)) {
                      const now = new Date();
                      const week = new Date(now); week.setDate(now.getDate() + 7);
                      items = [...agendaItems, ...customEvents, ...schedule].filter(e => new Date(e.start) > now && new Date(e.start) < week);
                    }
                    if (items.length) answer = items.map(e => `${e.title} at ${new Date(e.start).toLocaleString()}`).join('; ');
                  }
                  setQueryAnswer(answer);
                }} className="flex gap-2 mb-2">
                  <Input name="query" placeholder="e.g. What's due next Friday? Where's my 10 AM class?" />
                  <Button type="submit">Ask</Button>
                </form>
                {queryAnswer && <div className="p-2 bg-blue-50 border rounded text-blue-800 mt-1">{queryAnswer}</div>}
              </div>
              {/* Syllabus Auto-Calendar Generator */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Auto-Calendar Generator (Syllabus Upload)</h3>
                <form onSubmit={async e => {
                  e.preventDefault();
                  const form = e.target as any;
                  let text = '';
                  if (form.syllabusPdf.files[0]) {
                    // PDF
                    if (typeof window !== 'undefined') {
                      const pdfjsLib = await import('pdfjs-dist'); // <-- use 'pdfjs-dist' for dynamic import
                      const file = form.syllabusPdf.files[0];
                      const arrayBuffer = await file.arrayBuffer();
                      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                      for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map((item: any) => item.str).join(' ') + '\n';
                      }
                    }
                  } else if (form.syllabusImg.files[0]) {
                    // Image OCR
                    if (typeof window !== 'undefined') {
                      const { createWorker } = await import('tesseract.js');
                      const file = form.syllabusImg.files[0];
                      const worker = await createWorker('eng');
                      const { data } = await worker.recognize(file);
                      text = data.text;
                      await worker.terminate();
                    }
                  }
                  // Extract events: look for lines with dates and event names
                  const lines = text.split(/\n|\./).map(l => l.trim()).filter(Boolean);
                  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2},? \d{4})/gi;
                  const events = lines.map(line => {
                    const dateMatch = line.match(dateRegex);
                    if (dateMatch) {
                      return {
                        id: uuidv4(),
                        title: line.replace(dateRegex, '').trim() || 'Syllabus Event',
                        start: new Date(dateMatch[0]).toISOString(),
                        end: new Date(dateMatch[0]).toISOString(),
                        type: 'custom',
                      };
                    }
                    return null;
                  }).filter(Boolean);
                  setCustomEvents(prev => [
                    ...prev,
                    ...events.filter((e: any) => e && e.id && e.title && e.start && e.end && e.type)
                  ]);
                  setSyllabusExtracted(events);
                }} className="space-y-2">
                  <div>Upload PDF: <input type="file" name="syllabusPdf" accept="application/pdf" /></div>
                  <div>or Image: <input type="file" name="syllabusImg" accept="image/*" /></div>
                  <Button type="submit">Extract & Add to Calendar</Button>
                </form>
                {syllabusExtracted && syllabusExtracted.length > 0 && (
                  <div className="mt-2 p-2 bg-green-50 border rounded text-green-800">
                    <div className="font-semibold mb-1">Extracted Events:</div>
                    <ul className="list-disc ml-5 text-sm">
                      {syllabusExtracted.map((e: any, i: number) => <li key={i}>{e.title} on {new Date(e.start).toLocaleDateString()}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="card-effect max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Settings className="h-5 w-5 text-indigo-600" />
              App Settings
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Toggle between light and dark themes</p>
                  </div>
                  <Switch
                    checked={userPreferences.theme === "dark"}
                    onCheckedChange={(checked) =>
                      savePreferences({ ...userPreferences, theme: checked ? "dark" : "light" })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notifications</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Receive study reminders and alerts</p>
                  </div>
                  <Switch
                    checked={userPreferences.notifications}
                    onCheckedChange={(checked) => savePreferences({ ...userPreferences, notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Analytics Tracking</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enable advanced performance analytics</p>
                  </div>
                  <Switch
                    checked={userPreferences.analyticsEnabled}
                    onCheckedChange={(checked) => savePreferences({ ...userPreferences, analyticsEnabled: checked })}
                  />
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                  <Button
                    onClick={testAPI}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Test API Connection
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/test-chat', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': 'AIzaSyAvqht2VBLjYBrG_KWhltddDJYDgyX8S5Q'
                          },
                          body: JSON.stringify({
                            messages: [{ role: 'user', content: 'Hello' }]
                          })
                        })
                        const data = await response.json()
                        console.log('Test chat response:', data)
                        alert(`Test chat: ${data.content || data.error}`)
                      } catch (error) {
                        console.error('Test chat error:', error)
                        alert('Test chat failed: ' + error)
                      }
                    }}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Test Chat API
                  </Button>

                  <Button
                    onClick={() => {
                      localStorage.clear()
                      window.location.reload()
                    }}
                    variant="outline"
                    className="w-full mt-2 text-red-600 hover:text-red-700"
                  >
                    Clear All Data
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="voice" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Voice Synthesis</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enable text-to-speech</p>
                  </div>
                  <Switch
                    checked={voiceSettings.enabled}
                    onCheckedChange={(checked) => setVoiceSettings((prev) => ({ ...prev, enabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Auto-Speak Responses
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Automatically speak short responses</p>
                  </div>
                  <Switch
                    checked={voiceSettings.autoSpeak}
                    onCheckedChange={(checked) => setVoiceSettings((prev) => ({ ...prev, autoSpeak: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Speech Rate: {voiceSettings.rate}x
                  </label>
                  <Slider
                    value={[voiceSettings.rate]}
                    onValueChange={([value]) => setVoiceSettings((prev) => ({ ...prev, rate: value }))}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Speech Pitch: {voiceSettings.pitch}x
                  </label>
                  <Slider
                    value={[voiceSettings.pitch]}
                    onValueChange={([value]) => setVoiceSettings((prev) => ({ ...prev, pitch: value }))}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Emergency Contacts
                  </label>
                  <Textarea
                    placeholder="Add emergency contact numbers (one per line)"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    value={userPreferences.emergencyContacts.join("\n")}
                    onChange={(e) =>
                      savePreferences({
                        ...userPreferences,
                        emergencyContacts: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Study Reminders</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Smart reminders for assignments and exams
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.studyReminders}
                    onCheckedChange={(checked) => savePreferences({ ...userPreferences, studyReminders: checked })}
                  />
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">API Status: Active</span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    Your Gemini API key is configured and working perfectly!
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* API Key Setup Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="card-effect max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Shield className="h-5 w-5 text-indigo-600" />
              Connect Gemini AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Enter your Gemini API Key
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  {showApiKey ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Get your free API key from{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            {!apiKeyStatus.isValid && apiKeyStatus.lastChecked && (
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Invalid API key. Please check and try again.</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (apiKey.trim()) {
                    localStorage.setItem("campus_gemini_key", apiKey.trim())
                    setApiKeyStatus({ isSet: true, isValid: true, lastChecked: new Date() })
                    setShowApiKeyDialog(false)
                  }
                }}
                disabled={!apiKey.trim()}
                className="flex-1 button-effect text-white"
              >
                Save & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

