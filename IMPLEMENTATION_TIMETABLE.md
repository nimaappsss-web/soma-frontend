# Timetable Implementation — Frontend (`soma-frontend`)

Implementation guide for the class timetable feature. Build from this doc directly.

- **Status:** to implement
- **Module:** principal wizard (`/admin/timetable`) + teacher read-only view (`/teach/timetable`)
- **UI language:** follow existing form/dashboard styling — white cards `bg-white border border-gray100 rounded-xl p-5`, `rounded-full` buttons, `text-sm font-semibold text-gray900` section titles, Iconsax icons with explicit `color` (never `currentColor`).

---

## 1. Wizard flow (4 steps)

Progress stepper at top: **Schedule · Breaks · Subjects · Preview**. Draft persists to localStorage across steps.

### Step 1 — Schedule
Two titled cards.

**Timetable Title card**
- `Input` bound to `title` (single string).

**Days & Periods card** — config blocks list (`schedule: Block[]`):
```ts
interface DayPeriodBlock {
  id: string;
  days: DayOfWeek[];      // "MONDAY".."FRIDAY"
  periodCount: number;    // 1..12
  startTime: string;      // first period start e.g. "08:00"
  intervalMinutes: number;// e.g. 40
  periods: { startTime: string; endTime: string }[]; // auto-generated
}
```
- Each block = weekday `MultiSelect` (Mon–Fri) + period-count stepper + start time + interval.
- On count/interval change **auto-generate** `periods` (Period 1..N, contiguous from startTime by interval).
- "Add another configuration" button appends a block.
- Rule: a day belongs to only one block. When a weekday isn't covered, inline warning: `You haven't set periods for {Friday} yet.` (chip list of missing days).
- Remove block: small circular delete button, `rounded-full` style.
- Derived: `weeklySlots = Σ block.periodCount × block.days.length`.

### Step 2 — Breaks
**Break Times card** — config blocks list (`breaks: BreakBlock[]`):
```ts
interface BreakBlock {
  id: string;
  label: string;          // "Short Break", "Long Break", optional
  days: DayOfWeek[];
  startTime: string;      // "11:00"
  endTime: string;        // "11:40"
}
```
- Labelled inputs: label text + day `MultiSelect` + `from`/`to` time inputs.
- Multiple blocks allowed; **multiple breaks per same day allowed**.
- Validation: break windows must sit inside the day's period span and not overlap each other or any period; warn inline otherwise (`Break overlaps a period on Monday.`).
- "Add another break" button beneath. Circular edit/delete per block.

### Step 3 — Subjects
Two titled cards.

**Select Subjects card**
- Subjects source: `useTimetableBuild(classId).subjects` — each `{ subjectId, name, teacherId, teacherName }`.
- Checkbox list; selected subjects render as **pills** (removable `×`).
- Under each subject show auto-attached teacher as sub-text (`Mrs Adeyemi`).
- Per subject optional **target periods/week** number input (`targets: Record<subjectId, number>`).

**Double Periods card**
```ts
interface DoublePeriodConfig { subjectId: string; days: DayOfWeek[] }
// doublePeriods: DoublePeriodConfig[]
```
- Helper text: *"Pick a subject and choose which days it runs double periods."*
- Subject `SelectDropdown` (class subjects) + day `MultiSelect` → **Set** button (`rounded-full`).
- On Set → pushes an **info card** (subject name + day chips) with **circular edit + delete** icon buttons; edit reopens the picker pre-filled.
- **"Add more"** button beneath the cards to add another subject.
- A subject may have only **one** card; configuring a subject here **auto-checks it** into the subject picker.
- Validation: subject must be selected in the picker; target must be `>= 2 × doubleDays` count.

### Step 4 — Preview
- Generated week grid (see §3). Breaks render as muted rows; double periods shown as merged/adjacent cells labeled `Double`.
- Allocation panel (see §4) + **Regenerate** button.
- Conflict panel (amber) listing each clash with a **Suggest fix** action (swaps the clashing slot to a free subject whose teacher is available).
- Guards: `Σ targets > weeklySlots` and `weeklySlots < subjects.length` block Publish with guidance.
- **Publish** → `usePublishTimetable` → success toast → clear draft → navigate to the class timetable view.

---

## 2. Files


### New / modified under `src/features/timetable/`

```
components/
  TimetableManagement.tsx    // REWRITE placeholder: class picker → view (TimetableGrid) or Build/Edit CTA
  TimetableWizard.tsx        // 4-step stepper + draft wiring
  ScheduleStep.tsx
  BreaksStep.tsx
  SubjectsStep.tsx
  PreviewStep.tsx
  TimetableGrid.tsx          // shared web (table) + mobile (day-tabs/list)
  TeacherTimetable.tsx       // teacher module page (read-only grid)
  ConflictPanel.tsx          // amber clash list + Suggest fix
  DoublePeriodsSection.tsx   // double period cards UI (Step 3)
api/
  useTimetableBuild.ts       // GET /timetable/build/:classId
  usePublishTimetable.ts     // POST /timetable/publish (mutation, invalidate timetableKeys.*)
  // existing hooks reused: useTimetable, useTeacherTimetable (retarget)
utils/
  allocate.ts                // pure scheduler (see §4)
  validationSchema.ts        // Zod: schedule/breaks/subjects/preview step validation
  draft.ts                   // localStorage draft helpers
hooks/
  useTimetableDraft.ts       // key: soma_timetable_draft_<classId>
types/index.ts               // DayPeriodBlock, BreakBlock, DoublePeriodConfig,
                             // SubjectPick, BuildResponse, PublishPayload, Conflict
utils/query-keys.ts          // reuse; add build/teacher keys
```
Z
### Routes (`src/App.tsx`)
- `/admin/timetable` → `<TimetableManagement />` (already wired, line ~131).
- New `/teach/timetable` → `<TeacherTimetable />` (add to teacher route group; add `getTimetable` nav item in `src/layouts/TeacherLayout.tsx` navItems, icon `CalendarTick`).

### Draft persistence (`useTimetableDraft`)
- Persist on every change: `{ step, title, schedule, breaks, selectedSubjects, targets, doublePeriods }`.
- On wizard open: restore + show "Continue where you left off" banner; notify when a weekday is still unconfigured.
- On successful publish: `localStorage.removeItem("soma_timetable_draft_<classId>")`.

---

## 3. TimetableGrid — responsive

- **Web (`md+:`)**: table — rows = period slots (with break rows), columns = **Mon–Fri**; cell = subject + teacher. Published/read-only renders from entries; preview renders from allocation result.
- **Mobile (`<md`)**: day-of-week chip selector + vertical card list (`time · subject · teacher`), break rows inline.
- Implement both via twin JSX with `hidden md:block` / `md:hidden` (see `useResponsiveVisibility` or plain Tailwind classes).
- Empty states: no timetable → friendly CTA; no entries for a day → muted "Free period".

---

## 4. `allocate.ts` (pure, unit-testable)

Inputs:
```
subjects: SubjectPick[]                       // { subjectId, name, teacherId, teacherName }
targets: Record<subjectId, number>            // principal-set (optional)
doublePeriods: Array<{ subjectId, days[] }>
weekdays: DayOfWeek[]                         // covered days per today's blocks
weeklySlotsPerDay: Record<DayOfWeek, number>  // from Step-1 blocks
busyTeachers: BusyTeacher[]                   // from build endpoint
```

Algorithm:
1. `weeklySlots = Σ weeklySlotsPerDay[day]`.
2. Validate: reject if `Σ targets > weeklySlots` (overflow → guide to reduce) or `weeklySlots < subjects.length` (guide to add periods/fewer subjects).
3. Place **every configured double period first** (double day = 2 adjacent slots on that day, counts toward target). Doubles win their adjacent pair before any singles scatter, since a target depends on its double. Enforce `targets[s] >= 2 × doubleDays[s]`.
4. Fill **remaining target periods** for set subjects (doubles already covered).
5. Give every **unset** subject ≥1 slot (a placed double satisfies this).
6. **Randomly** scatter remaining free slots across unset subjects (each preview re-rolls; Regenerate re-rolls this step).
7. Spread each subject's slots across the week (avoid stacking on one day when possible).
8. Assign period indices by day (sorted by startTime). Detect conflicts vs `busyTeachers` (same teacher, same day, overlapping time) and internal per-day duplicates → return `conflicts[]` + `suggestions[]`.

Regenerate = re-run steps 5–6 (set subjects, doubles, and targets hold).

Publish payload = flat entries `{ subjectId, day, period, startTime, endTime }` (teacher resolved from `subjects`) + `{ classId, title, breaks }` → `POST /timetable/publish`.

---

## 5. QA checklist (frontend)

1. Step 1: Mon–Thu 8 / Fri 6 configs generate correct period times; missing-Friday warning shows; weeklySlots = 38.
2. Two break blocks (day-grouped) + multiple breaks on one day render and validate.
3. Step 3: subjects show teacher sub-text; double-period card add/edit/delete works; circular buttons; subject auto-checks.
4. Step 4: Regenerate reshuffles only unset-subject fills; set targets stay capped; double cells labeled.
5. Teacher clash (SS1A vs SS1B shared Math teacher, same time) flagged with Suggest fix.
6. Overflow guards block publish with guidance.
7. Draft survives reload; cleared after publish.
8. Mobile: day-tab list view matches web grid data; break rows present; nothing overflows horizontally.
9. Unapproved teachers still locked out of `/teach/timetable` (TeacherLayout gate already handles).