export class VoiceManager {
  private synthesis: SpeechSynthesis | null = null
  private recognition: any = null
  private isSupported = false

  constructor() {
    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis
      this.recognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      this.isSupported = !!(this.synthesis && this.recognition)
    }
  }

  speak(text: string, options: { rate?: number; pitch?: number; voice?: string } = {}) {
    if (!this.synthesis || !this.isSupported) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate || 1.0
    utterance.pitch = options.pitch || 1.0

    if (options.voice) {
      const voices = this.synthesis.getVoices()
      const selectedVoice = voices.find((voice) => voice.name.includes(options.voice!))
      if (selectedVoice) utterance.voice = selectedVoice
    }

    this.synthesis.speak(utterance)
  }

  listen(callback: (transcript: string) => void, onError?: (error: any) => void) {
    if (!this.recognition || !this.isSupported) return

    const recognition = new this.recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      callback(transcript)
    }

    recognition.onerror = (event: any) => {
      if (onError) onError(event.error)
    }

    recognition.start()
    return recognition
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  getAvailableVoices() {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  isVoiceSupported() {
    return this.isSupported
  }
}
