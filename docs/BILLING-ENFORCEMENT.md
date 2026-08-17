# Soma — Billing & Plan Enforcement (Design Reference)

> Working reference for how Soma charges schools for access and how the offline-first app enforces plans. Last updated: Aug 2026.

## 1. Billing model

**Hybrid: a genuinely usable free tier + per-student pricing tiers, billed per term, with an annual discount.**

- **Free tier** — small/local schools start at zero cost (no barrier to adoption).
- **Per-student pricing** — scales fairly: a 60-student village school pays a fraction of a 2,000-student school; advanced schools fund premium tiers.
- **Term billing** — matches school cash flow (3 terms/year); annual option discounted (~price of 2 terms) to reduce churn.
- **Payment methods (local-first)** — Paystack (NG/GH), Flutterwave (pan-Africa), Stripe (international/advanced), plus a **manual invoice fallback** (bank deposit, admin marks paid) for schools that can't pay online.

| Tier | Size (students) | Price | Includes |
|------|----------------|-------|----------|
| Free | ≤ 50 | ₦0 | Core: students, attendance, results |
| Starter | ≤ 300 | per student / term | + parents portal, lesson notes, announcements |
| Growth | ≤ 1,000 | per student / term | + timetable, CA/exams, calendar |
| Enterprise | unlimited | custom | + finance, analytics, API, branding, multi-branch, SLA |

*(Numbers illustrative — to be finalized.)*

## 2. Enforcement philosophy

The app is **offline-first** (PWA + IndexedDB/Dexie). Core truths:

- **You cannot fully block offline reads of cached data.** Any offline-capable client can be read/copied. So we don't try to hard-block the app shell (client-side DRM would be breakable and destroy the product promise for local schools with flaky internet).
- **The server is the eventual authority** because *sync requires a connection.* That is the leverage.
- **Enforcement lives at the sync/write boundary**, not the app shell. Non-paying schools degrade to a stale, read-only, no-new-data experience — which pushes renewal without breaking offline trust.
- **Data ownership**: export is always allowed.

## 3. Plan definition — the single source of truth

Every gate reads from the plan record; enforcement code is **not** hardcoded. Changing pricing = changing plan config, not code.

Each plan defines:

- `status` — `ACTIVE | TRIAL | EXPIRED | PAST_GRACE | CANCELLED`
- `tier` — `free | starter | growth | enterprise`
- `studentQuota` — max students (e.g. free = 50)
- `currentPeriodEnd` + `graceUntil` (`periodEnd + graceDays`)
- `features` — module flags (timetable, finance, analytics, API, branding…)
- `renewalBasis` — per-student-per-term / annual / flat

## 4. Enforcement layers

1. **Login / refresh** — access tokens expire (~30 days); refresh requires the server, which refuses tokens for lapsed schools.
2. **Sync gateway** — the primary toll gate. Every write through `/api/*` is checked; rejected with structured `402` when expired or over quota.
3. **Quota checks (free tier)** — server-side on writes (e.g. "cannot add student 51 on free plan").
4. **Feature gating** — routes (e.g. finance API) check `features` before serving.
5. **UI state** — same plan drives the banner, read-only switch, and Billing & Plan tab.

## 5. Graceful degradation stages

| Stage | Reads (cache) | Writes (sync) | UX |
|-------|--------------|--------------|-----|
| Active | ✅ | ✅ | Normal |
| Expired → grace (7–14 days) | ✅ | ✅ w/ warning | Soft banner; forgiving for local schools |
| Past grace | ✅ read-only | ❌ `402 PLAN_EXPIRED` | Persistent banner + read-only UI |
| Lapsed + token expiry | stale cache only | ❌ | Logged out on next online check |

## 6. Practical mechanics

- **Prisma**: `Subscription` / `SchoolPlan` model (plan, status, period, grace, quota, provider records) linked to `School`.
- **Middleware**: `requireActivePlan()` on write routes → `402 { code: "PLAN_QUOTA_EXCEEDED" | "PLAN_EXPIRED" }`; plan check in `authenticateToken`/refresh.
- **JWT**: carries short-lived `planStatus` / `planExpiresAt` so the client can show state before a request fails.
- **Client**: `usePlanStatus` hook (from `/auth/me` + cached plan record in Dexie); read-only UI mode; sync queue pauses on `402` and shows "pending renewal".
- **UI surfaces**: dashboard banner; Settings → **Billing & Plan** tab (plan, usage vs quota, upgrade, renewal, invoice history); manual invoice marking for non-online payers.
- **Payments**: Paystack / Flutterwave / Stripe webhooks update `Subscription.status` + `periodEnd`; invoice + receipt emails via SendGrid.

## 7. Open decisions

1. **Market & currency** — Nigeria-only first vs pan-African day one (drives Paystack vs Flutterwave vs both).
2. **Pricing structure** — per-student vs flat-tier vs hybrid ("per student, min per term").
3. **Free tier cutoff** — 50 students? and which features are free vs paid.
4. **Trial length** — 30 days premium, or free first term.
5. **Grace length & strictness** — soft write-warning forever vs hard read-only lock after grace (leaning: hard lock after grace).
6. **Feature-to-tier matrix** — which modules in which tier (e.g. finance in Growth or Enterprise; timetable allocator as paid add-on).
7. **Quota enforcement** — hard server stop vs UI-only nudge.
8. **Offline enforcement tolerance** — confirmed: never hard-block; degrade at sync boundary.
