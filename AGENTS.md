# Soma — Codebase Reference for Agents

## Stack
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **React Router v8** (`react-router`)
- **TanStack Query v5** (`@tanstack/react-query`) — server state
- **Dexie.js** — IndexedDB for offline cache
- **Zod** — schema validation
- **React Hook Form** (`react-hook-form`) — form state
- **Motion** (`motion/react`) — animations
- **Axios** — HTTP client with interceptor
- **Lucide React** + **Iconsax React** — icons
- **shadcn/ui-style custom components** — `class-variance-authority` + `tailwind-merge`
- **Vite PWA** — offline PWA support

---

## Feature-Based Architecture

Every feature lives in `src/features/<feature-name>/` with this structure:

```
src/features/<feature-name>/
  api/
    index.ts              — barrel export: re-export all hooks
    useXxx.ts             — React Query hooks (queries & mutations)
  components/
    Xxx.tsx               — feature-specific UI components
  types/
    index.ts              — all TypeScript interfaces & types
  utils/
    query-keys.ts         — React Query key factories
    validationSchema.ts   — Zod schemas
```

### Existing Features

| Feature | Path | Hooks |
|---------|------|-------|
| auth | `src/features/auth/` | `useLogin`, `useVerifyOTP`, `useMe`, `useRegisterPrincipal`, `useRegisterSchool`, `useCompleteRegistration`, `useForgotPassword`, `useResetPassword`, `useChangePassword`, `useCheckIdentifier`, `useInviteInfo`, `useAcceptParentInvite` |
| students | `src/features/students/` | `useStudents`, `useAllStudents`, `useStudentDetail`, `useCreateStudent`, `useBulkCreateStudents`, `useUpdateStudent`, `useGenerateAdmission` |
| teacher | `src/features/teacher/` | `useTeacherProfile`, `useMyFormClass`, `useMyAssignments`, `useTeachers`, `useTeacherDetail`, `useBulkInvite`, `useResendInvite`, `useMarkAttendance`, `useAttendance`, `useStudentAttendanceHistory` |
| principal | `src/features/principal/` | `useInviteTeacher`, `useAcceptInvite`, `useSubjects`, `useClasses`, `useCreateSubject`, `useDeleteSubject`, `useCreateClass`, `useDeleteClass`, `useUpdateSchool`, `useParents`, `useResendParentInvite`, `useSchoolSettings` |
| lesson-notes | `src/features/lesson-notes/` | `useLessonNotes`, `useCurriculumSubjects`, `useCurriculumTopics`, `useGenerateLessonNote`, plus standalone `saveLessonNote` / `deleteLessonNote` |
| parent | `src/features/parent/` | `useParentProfile` |
| settings | `src/features/settings/` | `useSchoolSettings` |

---

## Patterns

### 1. API Hooks: Barrel Exports

`api/index.ts` re-exports every hook by name:

```ts
export { useStudents } from "./useStudents";
export { useCreateStudent } from "./useCreateStudent";
```

Never export `default`. Always named exports.

### 2. Query Key Factory (`utils/query-keys.ts`)

Every feature defines a query key factory:

```ts
export const studentKeys = {
  all: ["student"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (id: string) => [...studentKeys.all, "list", id] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};
```

Use `as const` for type safety. Follow this exact shape. Add params to `list()` or `detail()` as needed (e.g., `list: (classId, date) => [...]`).

### 3. Mutation Hook Pattern

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import type { CreateStudentPayload, Student, AxiosErrorResponse } from "../types";

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation<Student, AxiosErrorResponse, CreateStudentPayload>({
    mutationFn: (payload) => fetchData("/students", "POST", payload),
    onSuccess: async () => {
      toast.success("Student added!");
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
```

- Generic signature: `useMutation<ResponseType, AxiosErrorResponse, PayloadType>`
- Always invalidate `lists()` and `details()` on success
- Use `transformError(error)` for error messages
- Use `toast.success` / `toast.error` from `react-hot-toast`
- Prefix import paths with `../../..` (relative from `api/` dir)

### 4. Query Hook Pattern

```ts
export const useAttendance = ({ classId, date }: { classId: string; date: string }) => {
  return useQuery<AttendanceQueryResponse>({
    queryKey: attendanceKeys.list(classId, date),
    queryFn: () => fetchData(`/attendance?classId=${classId}&date=${date}`, "GET"),
    enabled: !!classId && !!date,
  });
};
```

- Use `enabled` to prevent fetch when params are missing
- Return type annotation via generic

### 5. Zod Validation Schema (`utils/validationSchema.ts`)

```ts
import { z } from "zod";

export const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  classId: z.string().min(1, "Class is required"),
  gender: z.enum(["M", "F"]).optional(),
});

export type StudentFormData = z.infer<typeof studentFormSchema>;
```

- Export both schema and inferred type
- Use inline error messages as second arg to `.min()`, `.max()`, etc.

### 6. Type Definitions (`types/index.ts`)

- Define all payloads, responses, and domain model types
- Export `AxiosErrorResponse` (shared pattern):

```ts
export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};
```

### 7. UI Components (`src/components/ui/`)

Built with `cva` + `cn()` pattern:

```ts
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 ...", {
  variants: {
    variant: { default: "bg-black ...", outline: "border ...", ghost: "..." },
    size: { default: "h-[45px] px-4", sm: "h-8 px-3", icon: "h-9 w-9" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
));
Button.displayName = "Button";

export { Button, buttonVariants };
```

- Use `@/lib/utils` path alias for `cn()`
- Use `forwardRef`
- Set `displayName` on every compound component
- Export both component and variants object

### 8. Offline-First Dexie Cache (student/lessons pattern)

For cache-first reads: subscribe to Dexie `liveQuery`, then fetch from API and merge:

```ts
const [cached, setCached] = useState<Student[]>([]);

useEffect(() => {
  const sub = liveQuery(() => db.students.where("classId").equals(classId).toArray())
    .subscribe({ next: (data) => setCached(data) });
  return () => sub.unsubscribe();
}, [classId]);

const query = useQuery({
  queryFn: async () => {
    const res = await fetchData(`/students?classId=...`, "GET");
    await db.transaction("rw", db.students, async () => { /* merge logic */ });
    return res;
  },
});

return { data: cached.length > 0 ? cached : query.data ?? [], ... };
```

### 9. Sync Queue (`src/sync/syncQueue.ts`)

For writes that should survive offline:

```ts
import { addToQueue } from "../../../sync/syncQueue";

await db.lessonNotes.put(cacheObj, id);
await addToQueue({
  userId,
  table: "lessonNotes",
  recordId: id,
  endpoint: `/lesson-notes/${id}`,
  method: "PUT",
  payload: data,
});
```

Same pattern for delete: `db.table.delete(id)` + `addToQueue({ method: "DELETE", ... })`.

### 10. Route Guards (`src/features/auth/components/`)

| Guard | Purpose |
|-------|---------|
| `ProtectedRoute` | Requires auth; redirects to `/login` if not authenticated |
| `GuestRoute` | Only for unauthenticated users; redirects to dashboard if logged in |
| `OnboardingRoute` | Redirects fully registered users away from onboarding |

Usage: `<Route path="/..." element={<ProtectedRoute><Page /></ProtectedRoute>} />`

### 11. Custom Hooks (`src/hooks/`)

Simple, focused, no barrel export needed. Use `export const useXxx = () => { ... }`.

Existing hooks: `useModal`, `useDebounce`, `useToggle`, `useClipboard`, `useLogout`, `useSpeechToText`, `useComponentVisible`, `useFilterBySearch`, `useAnimatedFavicon`, `useObjectURL`, `useResponsiveVisibility`, `useMergeRefs`, `useUserIsAdmin`.

### 12. Contexts (`src/contexts/`)

- `AuthContext` — provides `useAuth()` with `user`, `login`, `logout`, `setTokens`
- `SyncContext` — provides `useSync()` with sync flush/poll status
- Both use `useCallback` for memoized context values

### 13. Modal Component (`src/components/others/Modal.tsx`)

Portal-based animated modal using `motion`, `react-focus-lock`, `react-remove-scroll`:

```tsx
<Modal showDialog={open} closeModal={handleClose} variant="middle">
  {children}
</Modal>
```

Variants: `"middle"` (center), `"right"` (slide-in), `"left"`, `"full"`, default `"center"`.

### 14. Imports

- UI components use `@/lib/utils` path alias for `cn()`
- Feature internals use relative imports (`../../../utils/fetchData`)
- `@/` maps to `src/` (via Vite alias)

### 15. `fetchData()` Wrapper (`src/utils/fetchData.ts`)

```ts
fetchData<T>(url, method, payload?, accept?, contentType?)
```

- Methods: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`
- Default content type: `"application/json"`
- Throws raw Axios error (use `transformError` to convert)

---

## Design & Style Reference

- **Font**: Geist (via `@fontsource` or self-hosted)
- **Colors** (from `src/index.css` `@theme inline`):
  - `--color-black: #0D0D0D`
  - `--color-pureWhite: #FAFAFA`
  - `--color-offWhite: #F7F7F8`
  - `--color-placeholder: #B3B3B3`
  - `--color-white: #EDEDED`
- **Shadows**: none or ultra-subtle. Avoid `shadow-md`+
- **Borders**: `1px solid var(--color-border)` / `border-input`
- **Border radius**: `rounded-full` for buttons/inputs, `rounded-xl`/`rounded-lg` for cards
- **Icons**: Lucide React (`lucide-react`) and Iconsax (`iconsax-react`)
- **Tailwind utility**: Tailwind v4 with `@theme inline` directive in `index.css`
- **Style guides**: See `.agents/skills/minimalist-ui/SKILL.md` and `.agents/skills/design-taste-frontend/SKILL.md`

---

## Database (Dexie — `src/db/db.ts`)

**DB name**: `somaDB`, current version **15**

| Table | Key Path | Indexes |
|-------|----------|---------|
| `students` | `id` | `name, classId, status` |
| `attendance` | `id` | `studentId, className, schoolId, date, syncStatus` |
| `caScores` | `id` | `studentId, className, schoolId, term, session, syncStatus` |
| `subjects` | `id` | — |
| `classes` | `id` | `level` |
| `teacherFormClass` | `id` | — |
| `teacherAssignments` | `id` | — |
| `teachers` | `id` | `userId` |
| `pendingInvites` | `id` | `userId` |
| `teacherDetails` | `id` | — |
| `parents` | `id` | `status` |
| `syncQueue` | `++id` | `status, createdAt, table, userId` |
| `lessonNotes` | `id` | `userId` |
| `schoolSettings` | `id` | — |

---

## Routing (`src/App.tsx`)

Provider stack: `AuthProvider > SyncProvider > Routes`

Route groups:
- `/login`, `/forgot-password`, `/reset-password` — GuestRoute
- `/onboarding` — OnboardingRoute
- `/admin*` — ProtectedRoute (principal dashboard & CRUD pages)
- `/teach*` — ProtectedRoute (teacher dashboard, attendance, lesson notes)
- `/parent`, `/staff` — ProtectedRoute
- `/settings/:tab` — ProtectedRoute
- `/invite/:token`, `/verify-teacher`, `/parent/setup` — public
- `*` → redirect to `/login`

---

## When Creating a New Feature

1. Create `src/features/<name>/api/`, `components/`, `types/`, `utils/`
2. Define types in `types/index.ts` (export `AxiosErrorResponse` if needed)
3. Create `utils/query-keys.ts` with key factory
4. Create `utils/validationSchema.ts` with Zod schemas
5. Create API hooks in `api/` (one file per hook)
6. Add barrel export `api/index.ts`
7. Create page in `src/pages/` or feature-specific `components/`
8. Register route in `src/App.tsx`
