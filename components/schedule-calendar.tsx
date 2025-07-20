import React, { useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Event as RBCEvent,
} from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ScheduleEvent } from "@/lib/data-store";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const locales = {
  "en-US": enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Map ScheduleEvent to react-big-calendar event
function toRBCEvent(event: ScheduleEvent): RBCEvent {
  return {
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
    title: event.title,
    resource: event,
  };
}

const eventColors: Record<string, string> = {
  Study: "#4f46e5",
  Class: "#16a34a",
  Meeting: "#f59e42",
  Personal: "#e11d48",
  Other: "#64748b",
};

export default function ScheduleCalendar({
  events,
  onEventsChange,
}: {
  events: ScheduleEvent[];
  onEventsChange: (events: ScheduleEvent[]) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  function handleSelectSlot(slotInfo: any) {
    setEditingEvent({
      id: uuidv4(),
      title: "",
      start: slotInfo.start.toISOString(),
      end: slotInfo.end.toISOString(),
      type: "Study",
      location: "",
      notes: "",
      reminderMinutes: 10,
      color: eventColors["Study"],
    });
    setSelectedSlot(slotInfo);
    setModalOpen(true);
  }

  function handleSelectEvent(event: any) {
    setEditingEvent(event.resource);
    setModalOpen(true);
  }

  function handleSave() {
    if (!editingEvent) return;
    const exists = events.some((e) => e.id === editingEvent.id);
    let updated;
    if (exists) {
      updated = events.map((e) => (e.id === editingEvent.id ? editingEvent : e));
    } else {
      updated = [...events, editingEvent];
    }
    onEventsChange(updated);
    setModalOpen(false);
    setEditingEvent(null);
    setSelectedSlot(null);
  }

  function handleDelete() {
    if (!editingEvent) return;
    const updated = events.filter((e) => e.id !== editingEvent.id);
    onEventsChange(updated);
    setModalOpen(false);
    setEditingEvent(null);
    setSelectedSlot(null);
  }

  function eventStyleGetter(event: any) {
    const color = event.color || eventColors[event.type] || "#64748b";
    return {
      style: {
        backgroundColor: color,
        borderRadius: "6px",
        color: "#fff",
        border: "none",
        padding: "2px 6px",
      },
    };
  }

  return (
    <div>
      <BigCalendar
        localizer={localizer}
        events={events.map(toRBCEvent)}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        popup
        views={["month", "week", "day"]}
        defaultView="week"
      />
      {modalOpen && editingEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {events.some((e) => e.id === editingEvent.id) ? "Edit Event" : "Add Event"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-3"
            >
              <Input
                placeholder="Title"
                value={editingEvent.title}
                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={editingEvent.start.slice(0, 16)}
                  onChange={(e) => setEditingEvent({ ...editingEvent, start: new Date(e.target.value).toISOString() })}
                  required
                />
                <Input
                  type="datetime-local"
                  value={editingEvent.end.slice(0, 16)}
                  onChange={(e) => setEditingEvent({ ...editingEvent, end: new Date(e.target.value).toISOString() })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="border rounded px-2 py-1"
                  value={editingEvent.type}
                  onChange={(e) => {
                    const type = e.target.value as ScheduleEvent["type"];
                    setEditingEvent({
                      ...editingEvent,
                      type,
                      color: eventColors[type || "Other"],
                    });
                  }}
                >
                  <option value="Study">Study</option>
                  <option value="Class">Class</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
                <Input
                  placeholder="Location"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                />
              </div>
              <textarea
                className="border rounded px-2 py-1 w-full"
                placeholder="Notes"
                value={editingEvent.notes}
                onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
              />
              <div className="flex gap-2 items-center">
                <label className="text-sm">Reminder (min before):</label>
                <Input
                  type="number"
                  min={0}
                  value={editingEvent.reminderMinutes || 10}
                  onChange={(e) => setEditingEvent({ ...editingEvent, reminderMinutes: Number(e.target.value) })}
                  style={{ width: 80 }}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="submit">Save</Button>
                {events.some((e) => e.id === editingEvent.id) && (
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 