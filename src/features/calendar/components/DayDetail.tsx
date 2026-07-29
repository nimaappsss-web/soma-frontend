import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import type { CalendarEvent, EventType, Holiday } from "../types";

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "EVENT", label: "Event" },
  { value: "EXAM", label: "Exam" },
  { value: "MEETING", label: "Meeting" },
  { value: "SPORTS", label: "Sports" },
];

const TYPE_COLORS: Record<string, string> = {
  EVENT: "bg-blue-100 text-blue-700",
  EXAM: "bg-purple-100 text-purple-700",
  MEETING: "bg-amber-100 text-amber-700",
  SPORTS: "bg-green-100 text-green-700",
};

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "Everyone",
  TEACHERS: "Teachers",
  PARENTS: "Parents",
  STAFF: "Staff",
};

interface DayDetailProps {
  date: Date | null;
  events: CalendarEvent[];
  holidays: Holiday[];
  onClose: () => void;
  onCreateEvent: (title: string, type: EventType) => void;
  onDeleteEvent: (id: string) => void;
  isPending: boolean;
}

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

export const DayDetail = ({ date, events, holidays, onClose, onCreateEvent, onDeleteEvent, isPending }: DayDetailProps) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("EVENT");

  if (!date) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreateEvent(title.trim(), type);
    setTitle("");
  };

  const hasEvents = events.length > 0;
  const hasHolidays = holidays.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.2 }}
        className="w-80 shrink-0 border-l border-gray-100 bg-white"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="text-sm font-semibold text-gray-900">{formatDate(date)}</span>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 space-y-2 min-h-[120px] overflow-y-auto max-h-[calc(100vh-280px)]">
          {hasHolidays && (
            <div>
              <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider mb-2">Holidays</p>
              {holidays.map((h) => (
                <div key={h.id} className="rounded-lg border border-orange-100 bg-orange-50/30 p-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                    <p className="text-sm font-medium text-gray-900">{h.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasEvents && (
            <div>
              {hasHolidays && <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Events</p>}
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border border-gray-100 p-3 mb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {event.type}
                      </span>
                      <p className="text-sm font-medium text-gray-900 mt-1">{event.title}</p>
                      {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
                      <span className="text-[10px] text-gray-400 mt-1 block">{AUDIENCE_LABELS[event.audience] ?? event.audience}</span>
                    </div>
                    <button
                      onClick={() => onDeleteEvent(event.id)}
                      className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasEvents && !hasHolidays && (
            <p className="text-xs text-gray-400 py-6 text-center">Nothing scheduled on this day</p>
          )}
        </div>

        <div className="border-t border-gray-100 mt-4 px-5 py-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">Add Event</p>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
          />
          <div className="flex gap-2">
            <SelectDropdown
              options={EVENT_TYPES}
              value={type}
              onChange={(v) => setType(v as EventType)}
              placeholder="Type"
              className="flex-1"
            />
            <Button onClick={handleSubmit} disabled={isPending || !title.trim()} size="sm">
              Add
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
