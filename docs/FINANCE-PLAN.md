# Soma Finance — Frontend Plan (School Fees v1)

> Working reference for the school-fees finance module frontend. Last updated: Aug 2026. Backend counterpart lives in the backend repo's `docs/finance-plan.md`.

## 1. Model

- **School fees only** for now (custom/other fees: phase 2).
- Fees are **per class + term**, invoiced **per student**.
- Two payment paths: **Manual** (primary, ₦0 fees) and **Paystack** (optional, fully automatic).
- **Parent does the data entry** (submits a transaction ID + amount), **bursar does the verification**. No phone call required.
- **Receipts auto-generate on every confirmed payment** and appear in the parent module.

## 2. Parent flows

### Manual submit (primary)
1. Parent sees each child's **per-term Fees card**: Fee, Paid so far, **Still to pay** (biggest number), status chip, progress bar, and "What you've paid" history.
2. Parent taps **"Pay"** → friendly walkthrough: step-by-step "How to pay" guide + a "Where do I find my transaction ID?" helper per app (Palmpay/OPay/Moniepoint/bank), plain language, sample snippet, no copy/paste assumed.
3. Parent submits **transaction ID + amount** (one big input at a time, read-back confirm screen: "You paid ₦50,000 for {child}. Correct?").
4. Status flips to **"Waiting for the school"** (blue chip) — never "PENDING" in parent-facing UI.
5. Bursar confirms → parent sees **"Confirmed ✓"**; bursar declines → **"Not accepted"** with reason.

### No-copy-paste fallback
- Every child card also shows the **school account details + child's reference code in large text**, so parents who can't use the form can still transfer and tell the bursar the reference verbally. Bursar records it as a confirmed payment directly.

### Paystack (option, deferred to phase 7)
- Invoice → "Pay now" → **exact surcharge + disclaimer shown first** (e.g. `₦85,000 + ₦1,375 = ₦86,375`) → hosted checkout → webhook confirms → parent sees "Confirmed ✓" automatically. No human step.

### Per-term Fees card data
- Invoice groups all payments for the term; **confirmed-only** sum drives Paid / Still-to-pay.
- Each history row shows: amount, status word (Confirmed ✓ / Waiting / Not accepted), **the submission date (the day the parent sent the txn ID)**, and the txn ID (truncated, tap-to-copy).
- Term switcher (1st/2nd/3rd Term); defaults to active term.

## 3. Bursar confirm flow

1. Bursar lands directly on `/admin/finance` after login.
2. Pending Verification queue: search a child by name/admission no → that student's open invoices with pending parent submissions (txn ID + amount + time).
3. Click → confirm sheet: **txn ID pre-filled** (from parent's submission, never re-typed), **amount pre-filled but editable**, remaining balance shown beside it.
4. Bursar verifies amount, corrects if wrong → **Confirm** → invoice flips PARTIAL/PAID, receipt auto-generates, parent notified.
5. Bursar-direct recording (cash/POS at the office) → straight to CONFIRMED, same reference rules.

## 4. Finance dashboard (replaces "coming soon")

- **Empty state**: "Your School related transactions will appear here."
- **Tabs**: Overview · Fee Structures · Invoices · Payments · Pending Verification.
- Overview: Expected / Collected / Outstanding / collection rate.
- Filters: class, status, term, method. Status badges. Accessible tab navigation.
- Bursar default permissions: payments + invoices + pending queue + receipts. Principal: + fee structures + bulk invoice generation. **Permissions evolve; keep role guards in arrays, not code paths.**

## 5. Roles & routing (bursar identity)

- **Bursar = non-teaching Staff member with role `BURSAR`.**
- Landing: `/admin/finance` via `AdminLayout` with **role-filtered sidebar** — each `NavItem` gets `roles?: string[]`. Bursar sees Home · Finance · (later) Announcements · Settings. Extensible: adding a nav item = one field change.
- `getPostAuthPath` gets `case "bursar": return "/admin/finance"`.
- **Role-aware invite**: one role dropdown (STAFF/BURSAR) feeding both paths:
  - Invite via email → `useInviteStaff({ name, email, role })`.
  - Generate link → `useGenerateInviteLink({ role })`.
- **Role-aware registration** (`VerifyTeacher.tsx`): if `inviteInfo.role` is BURSAR/STAFF, hide form-class + subject-assignment sections (name/email/password only).

## 6. Conflict prevention

- **Duplicate txn ID**: rejected on submit (already exists pending or confirmed) and on confirm (unique per school). One txn ID = one payment.
- **Only CONFIRMED counts** toward invoice PARTIAL/PAID.
- **Auto-reject siblings**: confirming payment that completes an invoice flips other pending submissions to REJECTED ("already paid").
- **Amount overshoot**: submit warns if > outstanding; confirm sheet clamps confirmed amount to remaining + flags. (True overpayment→credit: phase 2.)
- **Offline/sync**: PENDING→CONFIRMED is a status flip through `syncQueue`; no sum re-writes, no lost updates.

## 7. Offline-first

- Finance reads cache-first in Dexie (new `payments`/`invoices` cache tables); writes through `syncQueue`.
- Parent submit, bursar confirm, and receipt generation all persist offline and reconcile on flush.

## 8. Notifications

- `FEE` notification type (backend adds it).
- Fan-out: parent submits → notify school; bursar confirms → notify parent; bursar declines → notify parent; reminder → "Send reminder" on unpaid invoices to linked parents.
- Parent-facing copy is plain language (Confirmed ✓ / Waiting / Not accepted), never enum codes.

## 9. Backend additions this plan depends on

See `docs/finance-plan.md` in the backend repo:
- `Payment.status` (PENDING/CONFIRMED/REJECTED) + `submittedAt`/`confirmedAt`
- `inviteStaff` passes role through to the invite token
- `requireFinance()` guard (PRINCIPAL | SCHOOL_ADMIN | BURSAR) on finance routes
- `POST /finance/invoices/bulk` (generate for whole class)
- `POST /api/webhooks/paystack` + signature verify (phase 7)
- Receipt generation on confirm; `FEE` notification type

## 10. Build order (frontend)

1. **Bursar identity**: routing case + role-filtered sidebar (`roles[]` on NavItems).
2. **Non-Teachers management**: `StaffManagement.tsx` (invite modal with role dropdown + list + resend/delete, mirroring `InviteTeacherModal`/`TeacherListSection`); role-aware `VerifyTeacher.tsx`.
3. **Finance dashboard**: Overview · Fee Structures · Invoices · Payments tabs, filters, badges, empty state, bulk-invoice UI.
4. **Bursar confirm flow**: Pending Verification queue + confirm sheet (prefilled txn ID, editable amount, clamp).
5. **Parent fees module**: per-term Fees cards + friendly submit walkthrough + account-details fallback.
6. **Receipts + notifications**: receipt UI (parent module), FEE notifications, reminders.
7. **Paystack** (deferred): subaccount onboarding + checkout + surcharge/disclaimer.

## 11. Decisions locked

- Manual is primary; Paystack optional with surcharge + disclaimer. ✅
- Parent submits txn ID + **amount** (enables part-payment); bursar confirms the amount. ✅
- Bursar = non-teacher, lands on `/admin/finance`, flexible permissions. ✅
- One role dropdown drives email-invite and generate-link. ✅
- Receipts auto-generate to parent module. ✅
- School fees only; custom fees phase 2. ✅