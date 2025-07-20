export class NotificationManager {
  private reminders: any[] = []

  scheduleReminder(reminderData: any) {
    const reminder = {
      id: Date.now().toString(),
      ...reminderData,
      scheduled: true,
    }

    this.reminders.push(reminder)

    // In a real app, this would integrate with system notifications
    console.log("Reminder scheduled:", reminder)

    // Simulate notification after a short delay for demo
    setTimeout(() => {
      this.showNotification(reminder)
    }, 5000)
  }

  private showNotification(reminder: any) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Campus Copilot Reminder", {
        body: reminder.title,
        icon: "/favicon.ico",
      })
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Campus Copilot Reminder", {
            body: reminder.title,
            icon: "/favicon.ico",
          })
        }
      })
    }

    // Fallback: console notification for demo
    console.log("🔔 Reminder:", reminder.title)
  }

  getActiveReminders() {
    return this.reminders.filter((r) => r.scheduled)
  }
}
