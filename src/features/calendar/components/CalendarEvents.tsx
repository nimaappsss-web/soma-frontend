import { useState } from "react";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent, useAcademicTerms, useHolidays } from "../api";
import { CalendarGrid } from "./CalendarGrid";
import { DayDetail } from "./DayDetail";
import type { CreateCalendarEventPayload, EventType, EventAudience } from "../types";

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "EVENT", label: "Event" },
  { value: "EXAM", label: "Exam" },
  { value: "MEETING", label: "Meeting" },
  { value: "SPORTS", label: "Sports" },
];

const AUDIENCES: { value: string; label: string }[] = [
  { value: "ALL", label: "Everyone" },
  { value: "TEACHERS", label: "Teachers Only" },
  { value: "PARENTS", label: "Parents Only" },
  { value: "STAFF", label: "Staff Only" },
];

const emptyPayload: CreateCalendarEventPayload = { title: "", date: "", type: "EVENT", audience: "ALL" };

const termLabel = (term: string) => {
  const map: Record<string, string> = { first: "First", second: "Second", third: "Third" };
  return map[term] ?? term;
};

const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const CalendarEvents = () => {
  const today = new Date();
  const fullYearFrom = `${today.getFullYear()}-01-01`;
  const fullYearTo = `${today.getFullYear() + 1}-12-31`;

  const { data: termsData } = useAcademicTerms();
  const terms = termsData?.terms ?? [];
  const activeTerm = terms.find((t) => t.isCurrent);

  const [selectedTermId, setSelectedTermId] = useState<string | "all">(activeTerm?.id ?? "all");

  const selectedTerm = selectedTermId === "all" ? null : terms.find((t) => t.id === selectedTermId) ?? null;
  const from = selectedTerm ? selectedTerm.startDate : fullYearFrom;
  const to = selectedTerm ? selectedTerm.endDate : fullYearTo;

  const { data: eventsData, isLoading: eventsLoading } = useCalendarEvents({ from: fullYearFrom, to: fullYearTo });
  const { data: holidaysData } = useHolidays({ from: fullYearFrom, to: fullYearTo });

  const createMutation = useCreateCalendarEvent();
  const deleteMutation = useDeleteCalendarEvent();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCalendarEventPayload>(emptyPayload);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (activeTerm) {
      return new Date(activeTerm.startDate.slice(0, 7) + "-01");
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const events = eventsData?.events ?? [];
  const holidays = holidaysData?.holidays ?? [];

  const termOptions = terms.map((t) => ({
    value: t.id,
    label: `${termLabel(t.term)} Term — ${t.session}`,
  }));

  const filterOptions = [{ value: "all", label: "All Terms" }, ...termOptions];

  const termRange = selectedTerm
    ? { start: selectedTerm.startDate, end: selectedTerm.endDate }
    : null;

  const handleTermFilterChange = (value: string) => {
    setSelectedTermId(value);
    if (value !== "all") {
      const t = terms.find((term) => term.id === value);
      if (t) {
        setCurrentMonth(new Date(t.startDate.slice(0, 7) + "-01"));
      }
    }
  };

  const handleCreate = () => {
    if (!form.title || !form.date) return;
    createMutation.mutate(form, { onSuccess: () => { setShowForm(false); setForm(emptyPayload); } });
  };

  const handleDayCreate = (title: string, type: EventType) => {
    if (!selectedDate) return;
    const dateStr = localDateKey(selectedDate);
    createMutation.mutate({ title, date: dateStr, type, audience: "ALL" });
  };

  const todayEvents = selectedDate
    ? events.filter((e) => {
        const ed = e.date.slice(0, 10);
        const sd = localDateKey(selectedDate);
        return ed === sd;
      })
    : [];

  const todayHolidays = selectedDate
    ? holidays.filter((h) => {
        const hd = h.date.slice(0, 10);
        const sd = localDateKey(selectedDate);
        return hd === sd;
      })
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">School Events</h1>
          <p className="text-sm text-gray-400 mt-0.5">Upcoming events and activities</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm">
          {showForm ? "Cancel" : "Add Event"}
        </Button>
      </div>

      {terms.length > 0 && (
        <div className="mb-5">
          <SelectDropdown
            options={filterOptions}
            value={selectedTermId}
            onChange={handleTermFilterChange}
            placeholder="Filter by term"
            className="w-60"
          />
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-3">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Event title"
          />
          <Input
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            type="date"
          />
          <div className="flex gap-3">
            <SelectDropdown
              options={EVENT_TYPES}
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v as EventType })}
              placeholder="Type"
              className="flex-1"
            />
            <SelectDropdown
              options={AUDIENCES}
              value={form.audience}
              onChange={(v) => setForm({ ...form, audience: v as EventAudience })}
              placeholder="Audience"
              className="flex-1"
            />
          </div>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-full border border-input bg-background px-4 py-2 text-sm placeholder:text-placeholder resize-none"
          />
          <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Adding..." : "Add Event"}
          </Button>
        </div>
      )}

      {eventsLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="flex gap-0">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <CalendarGrid
                currentMonth={currentMonth}
                events={events}
                holidays={holidays}
                termRange={termRange}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onMonthChange={setCurrentMonth}
              />
            </div>
            {events.length === 0 && holidays.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No events or holidays yet.</p>
            )}
          </div>
          {selectedDate && (
            <DayDetail
              date={selectedDate}
              events={todayEvents}
              holidays={todayHolidays}
              onClose={() => setSelectedDate(null)}
              onCreateEvent={handleDayCreate}
              onDeleteEvent={(id) => deleteMutation.mutate(id)}
              isPending={createMutation.isPending || deleteMutation.isPending}
            />
          )}
        </div>
      )}
    </div>
  );
};
