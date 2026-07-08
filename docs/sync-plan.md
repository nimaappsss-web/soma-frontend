# Offline-First Sync Plan

## Phase 1: Read Cache (DONE)

Subjects and classes use cache-first reads:

- UI reads from Dexie instantly via `liveQuery`
- `useQuery` fires API request in background
- API response overwrites Dexie cache
- On failure (offline), Dexie data persists
- Writes (create/delete) require internet — toast if offline

**Tables added**: `subjects`, `classes`

**Files**: `src/db/db.ts`, `src/features/principal/api/useSubjects.ts`, `useClasses.ts`

---

## Phase 2: Student & Attendance Sync Queue

### Goal
Offline-first CRUD for students, attendance, and CA scores.

### Sync Queue Table

Add to Dexie:

| Field | Type | Purpose |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `table` | `string` | Target Dexie table (`students`, `attendance`, `caScores`) |
| `operation` | `"create" \| "update" \| "delete"` | What to do on the server |
| `recordId` | `string` | ID of the local record |
| `payload` | `object` | Full body to send to API |
| `previousSnapshot` | `object \| null` | Record data before the mutation (for 3-way merge / conflict detection) |
| `status` | `"pending" \| "in_flight" \| "failed"` | Current queue state |
| `retryCount` | `number` | Attempt counter |
| `lastError` | `string \| null` | Error message from last attempt |
| `order` | `number` | Monotonic sequence — operations replay in order |

### Conflict Resolution

**Last-Write-Wins (LWW)** by `updatedAt` for MVP.

Comparison: `local.updatedAt > server.updatedAt` → send local; otherwise → discard local and accept server.

For 3-way merge later: compare `previousSnapshot` against the current server record to detect if another client modified it between read and write.

### Sync Orchestrator

`src/sync/orchestrator.ts`:

- On connectivity change (`navigator.onLine`), drain the queue
- Process operations in `order` ascending
- For each: set `status = "in_flight"`, send to API, on success delete from queue, on failure set `status = "failed"` + increment `retryCount`
- Exponentially back off retries (1s, 2s, 4s, 8s... max 60s)
- Expose `queueSize` as observable for a sync status indicator in the UI

### Write Wrappers

Every mutation (create student, mark attendance, save CA score):

1. Generate local `id` (UUID)
2. Prepend `order` = `Date.now()` (monotonic within a device)
3. Write record to Dexie with `data` as-is
4. Push `{ table, operation, recordId, payload, previousSnapshot, order }` to queue

### Sync Status Indicator

Small pill in the header/sidebar showing:

- "All changes saved" (queue empty)
- "Saving..." (queue draining)
- "N changes pending" (queue has items, offline or retrying)

---

## Planned File Structure

```
src/
  db/
    db.ts              — Dexie schema (all tables)
    cache.ts           — helpers for read-cache pattern (if extracted)
  sync/
    orchestrator.ts    — queue processor, online/offline listener
    queue.ts           — CRUD helpers for the sync queue table
    conflict.ts        — LWW / 3-way merge logic
    status.ts          — observable for queue size / UI indicator
  features/principal/api/
    useSubjects.ts     — read cache (DONE)
    useClasses.ts      — read cache (DONE)
    ...mutations       — writes always go through sync queue
```

---

## Decision Log

| Date | Decision |
|---|---|
| 2026-07-07 | Read cache first for subjects/classes; writes stay online-only |
| 2026-07-07 | Sync queue with `previousSnapshot` for future 3-way merge, even though MVP uses LWW |
| 2026-07-07 | `synced: boolean` flag is too blunt — replaced by full sync queue table |
