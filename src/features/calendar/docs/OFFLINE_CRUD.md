# Offline-First CRUD Pattern

## Architecture

Every feature that needs offline support uses **Dexie (IndexedDB)** as the source of truth for reads and a **sync queue** (IndexedDB table) to persist writes when offline. The sync context processes the queue in the background — sending queued HTTP requests when the app regains connectivity.

```
User Action → Write to Dexie → Queue HTTP request
                                         ↓
                              Sync Context (background)
                                         ↓
                              HTTP request → Server response → Update Dexie
```

---

## ID Strategy — The Hardest Lesson

Every create operation generates a client-side UUID using `crypto.randomUUID()`:

```ts
const id = crypto.randomUUID(); // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

This UUID is used for three things:

| Purpose | Where | Why |
|---------|-------|-----|
| **Dexie primary key** | `db.holidays.put(cache, id)` | So the record renders instantly in the UI |
| **Sync queue recordId** | `addToQueue({ recordId: id })` | So the sync context can find and replace this record later |
| **POST payload** | `payload: { ...payload, id }` | So the server can use THIS id instead of generating its own |

### What you'll see in IndexedDB

Open DevTools → Application → IndexedDB → `somaDB` → `<table>` and you'll see two ID formats coexisting:

```
f47ac10b-58cc-4372-a567-0e02b2c3d479   ← Unsynced (crypto.randomUUID format)
cms57ivzp00057jy29p16woo                ← Synced (server-generated CUID format)
```

**This is normal.** The UUID-format records are either:
- Newly created and waiting for sync (status: `pending` in syncQueue)
- Orphaned temp records that need cleanup (see notice below)

The server-format records have been successfully synced. Once the sync context processes the POST:
1. It `put`s the server response (with the server's ID) into Dexie
2. It `delete`s the temp record (with the UUID)

### What can go wrong

**If the server uses your UUID** (returns the same `id` you sent): The sync context `put` simply overwrites the temp record in place. No delete needed for the data — the ID stays the same. This is the ideal scenario.

**If the server ignores your UUID** (generates its own `id`): The sync context must `put` the server record (new ID) then `delete` the temp record (old UUID). The UI sees a brief flash where two records briefly exist, then the temp one is removed. This still works correctly.

**If you forget to include `id` in the payload:** The server generates its own ID, but the sync context has no way to match the response to the temp record. The temp UUID record stays in Dexie permanently (orphaned). On refresh, the queryFn bulkPut adds the server record alongside it. **Result: duplicates in the UI.**

**If the sync context's `delete` runs before `put`:** The temp UUID record is removed, and `useLiveQuery` sees an empty Dexie for a moment. The UI flashes empty before the `put` adds the server record back. **Fix:** Always `put` first, then `delete`.

**If you use `invalidateQueries` instead of relying on `useLiveQuery`:** The queryFn refetches from the server, sees the newly created record, and does `bulkPut`. But `useLiveQuery` may still be mid-update, causing a race where the UI shows stale data momentarily. **Fix:** Never `invalidateQueries`. `useLiveQuery` reacts to Dexie changes instantly — no manual invalidation needed.

### Debugging duplicates

If you see two records for the same item in IndexedDB:

1. Check if both have different IDs (one UUID, one server format). If yes, the temp record wasn't cleaned up — see the response handling in SyncContext.
2. Check the sync queue (`syncQueue` table in IndexedDB). If there's a pending or failed item for the same `recordId`, the POST hasn't completed successfully.
3. Check the Network tab for the POST response. Does it have `id` at the top level? If not, the sync context can't match it and the temp record stays.
4. Check if the payload includes `id`. If not, the server generated a different ID and the sync context can't match the response.

---

## File Structure

```
src/features/<feature>/
  api/
    index.ts              — barrel export of all hooks
    use<Name>s.ts         — list query hook (useLiveQuery + useQuery)
    use<Name>Detail.ts    — detail query hook (optional)
    useCreate<Name>.ts    — create mutation
    useUpdate<Name>.ts    — update mutation
    useDelete<Name>.ts    — delete mutation
  types/
    index.ts              — all payloads, responses, cache types
  components/
    <Name>List.tsx        — UI components
```

---

## Rules

### 1. Create — `useCreate<Name>.ts`

```ts
const id = crypto.randomUUID();

// 1. Write to Dexie FIRST
const cache: XxxCache = { id, userId: user!.id, ...fields, createdAt: Date.now() };
await db.xxx.put(cache, id);

// 2. Queue POST with client UUID in payload
await addToQueue({
  userId: user!.id,
  table: "xxx",
  recordId: id,
  endpoint: "/xxx",
  method: "POST",
  payload: { ...payload, id },  // ← MUST include id
});

// 3. Return immediately (optimistic)
return { id, ...payload, ... } as Xxx;
```

**NOTICE — ID in payload is THE rule:** The `id` MUST be included in the `addToQueue` payload (`payload: { ...payload, id }`). Without it, the server generates its own ID and the sync context cannot match the response to the temp record, causing **permanent duplicate records** in Dexie.

**NOTICE:** No `invalidateQueries` in `onSuccess` — `useLiveQuery` in the list hook picks up the Dexie change automatically.

---

### 2. Read — `use<Name>s.ts`

```ts
// 1. Subscribe to Dexie for instant offline reads
const cached = useLiveQuery(
  () => db.xxx.where("userId").equals(userId).toArray(),
  [userId],
);

// 2. Background sync — fetch from API and populate Dexie
const query = useQuery({
  queryKey: [...keys.lists(), params],
  queryFn: async () => {
    const res = await fetchData<XxxListResponse>(`/xxx?...`, "GET");
    if (res.items?.length) {
      await db.xxx.bulkPut(
        res.items.map((i) => toCache(i, userId)),
      );
    }
    return res;
  },
  enabled: !!userId,
  staleTime: 5 * 60 * 1000,
});

const cachedList = cached?.map(fromCache) ?? [];

return {
  data: cached !== undefined ? { items: cachedList } : (query.data ?? { items: [] }),
  isLoading: (cached === undefined || (Array.isArray(cached) && cached.length === 0 && query.isLoading)),
  error: query.error ?? undefined,
};
```

**WARNING:** Use `cached !== undefined` not `cachedList.length > 0`. The latter causes a bug: when the LAST item is deleted, `cachedList` is `[]`, the condition is false, and the hook falls through to stale `query.data` — making the deleted item reappear.

**WARNING:** The `isLoading` condition must account for the case where Dexie is empty (cleared IndexedDB) but the backend query is still loading. Without this, the user sees an empty state flash before data arrives. Use: `(cached === undefined || (Array.isArray(cached) && cached.length === 0 && query.isLoading))`.

**NOTICE:** `staleTime: 5 * 60 * 1000` prevents the query from refetching on every mount. The `useLiveQuery` handles reactivity locally.

---

### 3. Update — `useUpdate<Name>.ts`

```ts
// 1. Read existing from Dexie
const existing = await db.xxx.get(id);

// 2. Merge update data
const merged: XxxCache = { ...existing!, ...data, userId: user!.id, updatedAt: Date.now() };

// 3. Write merged to Dexie
await db.xxx.put(merged, id);

// 4. Queue PATCH
await addToQueue({
  userId: user!.id,
  table: "xxx",
  recordId: id,
  endpoint: `/xxx/${id}`,
  method: "PATCH",
  payload: data,  // ← only the changed fields
});
```

**NOTICE:** PATCH payloads should only contain the fields being updated, not the full object. The sync context skips Dexie writes for PATCH responses because local data is authoritative.

**NOTICE:** No `invalidateQueries` — same reason as create.

---

### 4. Delete — `useDelete<Name>.ts`

```ts
// 1. Delete from Dexie IMMEDIATELY
await db.xxx.delete(id);

// 2. Queue DELETE
await addToQueue({
  userId: user!.id,
  table: "xxx",
  recordId: id,
  endpoint: `/xxx/${id}`,
  method: "DELETE",
  payload: null,
});
```

**NOTICE:** No `invalidateQueries`. The `useLiveQuery` picks up the Dexie delete instantly.

---

### 5. Sync Context — `SyncContext.tsx`

The sync context processes each queue item. The critical POST/PUT handler:

```ts
if (item.method === "POST" || item.method === "PUT") {
  const table = db[item.table as keyof typeof db] as any;
  if (table && response && typeof response === "object" && "id" in response) {
    await table.put({ ...response, userId: item.userId });
    if (response.id !== item.recordId) {
      await table.delete(item.recordId);
    }
  }
}
```

**WARNING #1 — Only delete if IDs differ:** When the server uses the client UUID (same `id` we sent), the `put` **overwrites** the temp record in place. If you then `delete(item.recordId)` with the same ID, you delete the record you just put — **the record vanishes from Dexie**. Only delete the temp ID when the server returned a *different* ID.

**WARNING #2 — Order matters:** When the server generates its own ID (different from ours), always `put` the server response *before* `delete`-ing the temp record. Doing it in reverse (`delete` then `put`) creates a brief window where Dexie has zero records — `useLiveQuery` picks this up and the UI flashes empty.

**WARNING #3 — Action vs Resource POSTs:** Not all POST queue items are resource creates. Action endpoints like `set-current` use `POST` with `payload: {}` and their `recordId` is an existing record ID. Never `delete` those. The outer check `response.id` naturally skips them — action endpoints return `{ message: "..." }` which doesn't have `id`, so the entire `if` block is skipped.

**WARNING #4 — Response without `id`:** If the server doesn't return the created object in the response at all, the outer guard `"id" in response` fails and nothing happens. The temp record stays in Dexie (with the client UUID). On the next queryFn fetch, `bulkPut` will add the server record alongside it, creating a duplicate. **Fix: make the server return the created object with its `id`.**

---

## Timezone Safety

Always use local date methods, not `toISOString()`. The `toISOString()` converts to UTC, which can shift dates:

```ts
// ❌ BAD — shifts dates in negative UTC offsets
d.toISOString().split("T")[0]

// ✅ GOOD — preserves local date
`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
```

This applies to:
- `toDateInput()` helpers for date input defaults
- Calendar grid key generation (`localDateKey()`)
- Any date comparison or filtering

---

## Types

Every feature needs three type groups:

```ts
// types/index.ts

// API payloads
export interface CreateXxxPayload { ... }
export interface UpdateXxxPayload { ... }  // all fields optional

// API responses
export interface Xxx { id: string; ... }
export interface XxxListResponse { items: Xxx[] }

// Error
export type AxiosErrorResponse = {
  response?: { data?: { message?: string }; status?: number };
  message?: string;
};
```

---

## Query Keys

```ts
// utils/query-keys.ts
export const xxxKeys = {
  all: ["xxx"] as const,
  lists: () => [...xxxKeys.all, "list"] as const,
  list: (...params: string[]) => [...xxxKeys.lists(), ...params] as const,
  details: () => [...xxxKeys.all, "detail"] as const,
  detail: (id: string) => [...xxxKeys.details(), id] as const,
};
```

---

## Component Patterns

- The list/read hook (`use<Name>s`) returns `{ data, isLoading, error }` — same shape as `useQuery`
- Components check `isLoading` first to show a skeleton/spinner before the empty state
- A `staleTime` of 5 minutes prevents unnecessary network requests while Dexie handles reactivity
- The `useLiveQuery` dependency array should only include values the query function depends on (typically `[userId]`)

---

## Checklist for New Features

- [ ] Define types (`CreatePayload`, `UpdatePayload`, response types, `XxxCache` in db.ts)
- [ ] Create query keys factory
- [ ] Create list hook with `useLiveQuery` + `useQuery`
- [ ] Create create hook — ID in payload, no `invalidateQueries`
- [ ] Create update hook — merge Dexie, PATCH queue, no `invalidateQueries`
- [ ] Create delete hook — delete Dexie, DELETE queue, no `invalidateQueries`
- [ ] Export all from `api/index.ts`
- [ ] Add Dexie table schema in `db.ts` with `"id, userId"` indexes
- [ ] Verify sync context handles it (auto — no changes needed if pattern followed)
- [ ] Sync context: `put` first, then only `delete` if `response.id !== item.recordId`
- [ ] Use `cached !== undefined` not `cachedList.length > 0`
- [ ] Include `(cached === undefined || (empty && query.isLoading))` in `isLoading`
- [ ] No `toISOString().split("T")[0]` — use local date helpers
