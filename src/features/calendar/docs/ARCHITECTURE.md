# Calendar Feature — Architecture

## Overview

The calendar feature lives at `src/features/calendar/` and provides three subtabs under `/admin/calendar/*`:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/calendar/events` | `CalendarEvents` | Monthly grid view with events + holidays, day detail panel |
| `/admin/calendar/holidays` | `CalendarHolidays` | List-based holiday CRUD (backup management view) |
| `/admin/calendar/terms` | `CalendarTerms` | Term definition CRUD (first/second/third, dates, set active) |

## Directory Structure

```
src/features/calendar/
  api/
    index.ts                      — barrel exports
    useCalendarEvents.ts           — query: events by date range
    useCalendarEventDetail.ts      — query: single event
    useCreateCalendarEvent.ts      — mutation: create + offline queue
    useUpdateCalendarEvent.ts      — mutation: update + offline queue
    useDeleteCalendarEvent.ts      — mutation: delete + offline queue
    useHolidays.ts                 — query: holidays by date range
    useCreateHoliday.ts            — mutation: create holiday + offline queue
    useDeleteHoliday.ts            — mutation: delete holiday + offline queue
    useAcademicTerms.ts            — query: all academic terms
    useCreateAcademicTerm.ts       — mutation: create term + offline queue
    useUpdateAcademicTerm.ts       — mutation: update term + offline queue
    useSetCurrentTerm.ts           — mutation: set active term + offline queue
    useDeleteAcademicTerm.ts       — mutation: delete term + offline queue
  components/
    CalendarEvents.tsx             — grid view page (events tab)
    CalendarGrid.tsx               — reusable monthly calendar grid
    DayDetail.tsx                  — slide-in panel for selected day
    CalendarHolidays.tsx           — list view page (holidays tab)
    CalendarTerms.tsx              — term management page (terms tab)
    CalendarManagement.tsx         — layout wrapper with <Outlet />
  types/
    index.ts                      — all TS interfaces
  utils/
    query-keys.ts                 — React Query key factories
    validationSchema.ts           — Zod schemas
  docs/
    ARCHITECTURE.md               — this file
```

## Data Flow

### Offline-First Pattern (all mutations)

All writes follow the same pattern established in the student feature:

```
User action
  → Mutation writes to Dexie immediately
  → Mutation queues network request in syncQueue table
  → Mutation resolves (UI updates via useLiveQuery)
  → SyncContext processes queue: PATCH/POST/DELETE sent to server
  → On success: sync context updates Dexie with server response (POST/PUT) or skips (PATCH)
```

**Key rule**: Mutations NEVER call `invalidateQueries`. The `useLiveQuery` hook from dexie-react-hooks picks up Dexie changes automatically. This prevents the race condition where a server refetch overwrites locally-edited data before the sync queue has been processed.

### Query Flow

```
Component mounts
  → useLiveQuery subscribes to Dexie (instant, cached data)
  → useQuery fetches from server (background, staleTime: 5min)
  → QueryFn bulkPuts server data into Dexie
  → If there are pending sync queue items for a record, local data is preserved
  → Component renders cached data (or falls back to query data if cache is empty)
```

### Calendar Grid — State

| State | Type | Description |
|-------|------|-------------|
| `currentMonth` | `Date` | First day of the visible month |
| `selectedDate` | `Date ∣ null` | Date clicked to open DayDetail |
| `selectedTermId` | `string ∣ "all"` | Term filter value |
| `showForm` | `boolean` | Toggle for the full create form |

### Term Filter Logic

1. On mount, `useAcademicTerms()` fetches all terms
2. Default filter: the term where `isCurrent === true`, or `"All Terms"` if none active
3. Selecting a term from the dropdown computes `from = term.startDate` and `to = term.endDate`
4. The calendar grid shows events/holidays for the full year, but **dims** dates outside the selected term's range
5. Month navigation is independent — user can browse any month regardless of selected term

## Event / Holiday Type Colors (CalendarGrid)

| Type | Dot Color | CSS |
|------|-----------|-----|
| EVENT | Blue | `bg-blue-500` |
| EXAM | Purple | `bg-purple-500` |
| MEETING | Amber | `bg-amber-500` |
| SPORTS | Green | `bg-green-500` |
| HOLIDAY | Orange | `bg-orange-500` |

Holidays are passed as a separate array to distinguish them from events visually.

## Key Design Decisions

- **No `invalidateQueries`** on mutation success — `useLiveQuery` handles UI updates
- **Broad fetch range** (full year) — prevents refetches when navigating months
- **Pending queue protection** — server data never overwrites locally-edited records that are awaiting sync
- **SyncContext PATCH handling** — PATCH responses don't overwrite Dexie (local data is authoritative); only POST/PUT replace temp IDs with server IDs
