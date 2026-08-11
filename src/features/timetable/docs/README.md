# Timetable — Teacher Schedules & Copy-Config (Offline-First)

Two features built on the same offline-first timetable cache (`db.timetableEntries`
+ `db.timetables`), following the patterns in
`src/features/calendar/docs/OFFLINE_CRUD.md`.

---

## 1. Copy Schedule Configuration From Another Class

Each class configures its own Schedule step (creche/KG can't share one
school-wide config). This lets the principal reuse an existing class's
configuration instead of rebuilding it.

### Flow

```
Select "Start from another class" → pick a class → reconstruct config → applied to Schedule step
```

### Where the data lives (offline-first)

| Data | Source (Dexie) | Why |
|------|----------------|-----|
| Source classes + slots | `db.timetableEntries` (every published/queued class, `className` on each row) | Works fully offline |
| Breaks per class | `db.timetables.breaksJson` (written by `usePublishTimetable` / `useTimetableCache(classId)`) | Exact break windows |
| Online hydration | `GET /timetable` (all school entries) | Merge-only `bulkPut`, silent on failure — never deletes |

### Key rules

- **Merge-only writes.** The hydration fetch never deletes from
  `timetableEntries`, so an offline-queued class's draft is never wiped. (This is
  why `useScheduleTemplates` does NOT reuse `useTimetableCache()` without a
  `classId` — that path deletes all entries when nothing is pending.)
- **No `invalidateQueries`.** A `liveQuery` on `timetableEntries` +
  `timetables` drives the source list reactively.
- **Current class excluded** via `excludeClassId` so you can't copy a class from
  itself.
- **Reconstruction** (`scheduleConfigFromTimetable`) groups days by their
  period-grid signature (distinct start times **and** break windows), so a
  shortened Friday splits into its own block. It runs through
  `normalizeSchedule`, the same path the wizard uses to derive period times.
- Only classes **with entries** in the cache appear as sources.

### Files

- `src/features/timetable/utils/scheduleConfig.ts` — `scheduleConfigFromTimetable()`
- `src/features/timetable/api/useScheduleTemplates.ts` — `useScheduleTemplates(classId?)`
- `src/features/timetable/components/wizard/ScheduleStep.tsx` — the copy control
- `src/features/timetable/api/index.ts` — barrel export

---

## 2. Teacher Timetable & Dashboard

The teacher's schedule is saved to their account via `useTeacherTimetableCache`
(offline-first read of `/timetable/teacher/:teacherId`, cached in
`db.timetableEntries`). Everything below is derived from that cache — no extra
network calls.

### Dashboard

- **Greeting** — `greetingFor(nextClass(entries))` under the header:
  - `In English Language · JSS 3 B right now — ends in 25 min.` (ongoing)
  - `English Language · JSS 3 B in 40 min.` (next up)
  - `You're all done for today — enjoy the rest of the day!` / `No classes scheduled today.`
- **Today's schedule card** — black `bg-gray900 rounded-2xl` card under the
  calendar: today's lessons (time block, subject, class) + a "Full week →" link.
  Friendly empty state on weekends / no classes.

### Timetable tab (`/teach/timetable`)

- **Subjects you teach** strip: colored dot (shared `buildSubjectColorMap` /
  `solidSwatch` palette) + subject, classes, weekly lesson count.
- **Week grid** below (desktop `TimetableGrid`, mobile `TimetableMobile`).
  Teacher names are blanked in the cells — showing your own name is noise; the
  subjects strip carries the class mapping.

### Files

- `src/features/timetable/utils/todaySchedule.ts` — `jsDayToDayOfWeek`,
  `entriesForToday`, `nextClass`, `greetingFor`
- `src/features/timetable/components/TodayScheduleCard.tsx`
- `src/pages/teach/TeacherDashboard.tsx` — greeting + card
- `src/pages/teach/TeacherTimetable.tsx` — subjects strip + grid

---

## Verification

- `npx tsc --noEmit` is the gate (repo-wide `npx eslint` is broken — missing
  `eslint-plugin-react-refresh`).
- Manual: publish a class → open another class's wizard → Schedule step shows
  the source class → copy → confirm blocks/periods/breaks match.
