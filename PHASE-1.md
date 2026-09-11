# Phase 1 Frontend Implementation Plan — School OS Portal

## Context

The School OS portal has comprehensive architecture and UX specs but only a Next.js 16 skeleton (create-next-app). Phase 1 must build the complete frontend from scratch: auth, design system, app shell, and all CRUD screens for People, Academics, and Settings — backed by a fully functional FastAPI backend.

**Backend location:** `../school-os-api`
**Frontend location:** `../school-os-portal` (this project)

### Backend Changes Required First
1. Add `must_change_password: bool` to `MeResponse` in `/auth/me` (needed for force-password-change flow)
2. Add `GET /audit-logs` read endpoint with cursor pagination (needed for dashboard activity and history tabs)

### Key Next.js 16 Conventions
- `LayoutProps<"/path">` and `PageProps<"/path">` are globally available typed helpers
- `params` and `searchParams` are **Promises** — must use `await` or React's `use()`
- Tailwind v4 uses `@import "tailwindcss"` and `@theme inline` (no tailwind.config.js)

---

## Implementation Batches

### Batch 1: Dependencies & Configuration

**Install packages:**
```
npm install axios @tanstack/react-query @tanstack/react-query-devtools react-hook-form @hookform/resolvers zod lucide-react clsx tailwind-merge date-fns cmdk sonner
npm install -D @tanstack/react-table
npx shadcn@latest init (style: new-york, baseColor: neutral, cssVariables: true)
```

**Files to create/modify:**
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `lib/constants.ts` — API_BASE_URL, stale times, pagination defaults, localStorage keys
- `app/globals.css` — Replace with shadcn CSS variables + calm premium color palette (neutral surfaces, one primary brand color, restrained semantics)
- `app/layout.tsx` — Update metadata to "School OS", keep Geist fonts, add `suppressHydrationWarning`

### Batch 2: Type Definitions

**Files to create:**
- `types/api.ts` — `CursorPage<T>`, `ApiError`, `CursorParams`, `ErrorCode` enum
- `types/auth.ts` — `LoginRequest`, `LoginResponse`, `UserBrief`, `RefreshRequest/Response`, `MeResponse`, `PasswordResetRequest/Confirm`, `PasswordChange`
- `types/person.ts` — `Person`, `PersonCreate`, `PersonUpdate`, `PersonMerge`, `PersonStatus`
- `types/academic.ts` — Year, Term, Class, Subject, ClassSubject, Cohort types + creates/updates + enums (SubjectType, status enums)
- `types/iam.ts` — Organization, School, User, Role, Membership, MembershipRole types + creates/updates + status enums
- `types/common.ts` — Contact, Address types + creates/updates, `EntityType`, `ContactType`, `AddressType` enums
- `types/index.ts` — Re-export barrel

### Batch 3: API Client & Services

**Files to create:**
- `services/api-client.ts` — Axios instance with interceptors:
  - Request: `Authorization: Bearer {token}`, `X-School-ID: {id}`, optional `X-Request-ID`
  - Response 401: token refresh with request queue (prevent parallel refreshes), redirect to login on failure
  - Response error: normalize into typed `ApiError` (branch on `error.code`)
  - Exports: `apiClient`, `setAccessToken()`, `clearAccessToken()`, `setSchoolId()`
- `services/auth.ts` — login, refresh, logout, getMe, requestPasswordReset, confirmPasswordReset, changePassword
- `services/persons.ts` — CRUD for `/persons` (includes `?search=` trigram, merge)
- `services/contacts.ts` — CRUD for `/contacts` (no version on PATCH/DELETE, requires entity_type+entity_id)
- `services/addresses.ts` — CRUD for `/addresses` (version required, requires entity_type+entity_id)
- `services/academics.ts` — CRUD for academic-years, academic-terms, academic-classes, subjects, class-subjects (no PATCH, only POST+DELETE), cohorts
- `services/iam.ts` — CRUD for schools, users, roles, memberships + `POST /memberships/{id}/roles`, `DELETE /memberships/{id}/roles/{roleId}`

### Batch 4: Providers & Core Hooks

**Files to create:**
- `providers/query-provider.tsx` — `"use client"`, QueryClientProvider with staleTime/gcTime config, ReactQueryDevtools
- `providers/auth-provider.tsx` — `"use client"`, AuthContext: user, isAuthenticated, isLoading, login(), logout(), refreshUser(). Tokens in module-level memory vars. On mount: try refresh. After login: call getMe(), store user.
- `providers/school-context-provider.tsx` — `"use client"`, SchoolContext: activeSchool, activeYear, schools[], years[], setActiveSchool(), setActiveYear(). Persists to localStorage. Auto-selects single school, `is_current` year. On school change: invalidate school-scoped queries.
- `providers/app-providers.tsx` — Composition: QueryProvider > AuthProvider > SchoolContextProvider
- `hooks/use-auth.ts` — useContext(AuthContext)
- `hooks/use-school-context.ts` — useContext(SchoolContext)
- `hooks/use-permissions.ts` — hasPermission(), hasAnyPermission(), hasAllPermissions() from user.permissions
- `hooks/use-cursor-pagination.ts` — Generic wrapper around useInfiniteQuery for cursor-paginated endpoints
- `lib/permissions.ts` — Permission code constants organized by module
- `lib/query-keys.ts` — Query key factory (all include schoolId)
- **Modify `app/layout.tsx`** — Wrap `{children}` with `<AppProviders>`

### Batch 5: Design System Components

**shadcn/ui CLI installs** (creates files in `components/ui/`):
```
npx shadcn@latest add button input label select dialog drawer tabs badge alert tooltip dropdown-menu breadcrumb skeleton avatar command popover separator card textarea switch scroll-area sheet table
```

**Custom components to create:**
- `components/ui/data-table.tsx` — Generic table with column definitions, sort indicators, skeleton loading, cursor pagination "Load more" button, mobile card layout
- `components/ui/status-badge.tsx` — Maps entity statuses to semantic colors (ACTIVE=green, INACTIVE=gray, etc.)
- `components/ui/permission-gate.tsx` — Renders children only if user has required permission
- `components/ui/sonner-provider.tsx` — Toaster from sonner with consistent styling
- `components/patterns/page-header.tsx` — Title + description + breadcrumb slot + primary action
- `components/patterns/empty-state.tsx` — Icon + title + description + action button
- `components/patterns/error-state.tsx` — Error display with retry, maps API error codes to human messages
- `components/patterns/form-section.tsx` — Titled section wrapper for form groups
- `components/patterns/confirm-dialog.tsx` — Reusable confirmation with destructive variant
- `components/patterns/stale-resource-dialog.tsx` — "Modified by someone else" reload dialog

### Batch 6: Layout Shell

**Files to create:**
- `components/layout/app-shell.tsx` — `"use client"`. Flex: sidebar (hidden on mobile) + main (header + content)
- `components/layout/sidebar.tsx` — `"use client"`. Permission-driven nav with Lucide icons. Groups: Home, People, Academics (Years, Terms, Classes, Subjects, Subject Assignments, Sections), Settings (School Profile, Users, Roles, Access). Active state via usePathname(). Collapsible on desktop. Uses user-facing terminology.
- `components/layout/header.tsx` — `"use client"`. Logo, SchoolSelector, YearSelector, search trigger (⌘K), UserMenu
- `components/layout/school-selector.tsx` — Dropdown w/ search for multi-school, static text for single-school
- `components/layout/year-selector.tsx` — Dropdown of academic years, auto-selects is_current
- `components/layout/user-menu.tsx` — Name, email, role context, switch school, change password, logout
- `components/layout/breadcrumb-nav.tsx` — Dynamic from route segments, maps to display names
- `components/layout/mobile-nav.tsx` — Bottom tab bar (Home, People, Academics, Settings) visible below md breakpoint
- `components/layout/command-palette.tsx` — `"use client"`. cmdk-based. Entity search (persons via API trigram, others from cache). Action search. Keyboard navigable. ⌘K/Ctrl+K trigger.
- `app/(app)/layout.tsx` — Auth guard + AppShell wrapper
- `app/(public)/layout.tsx` — Minimal centered layout
- `app/(auth)/layout.tsx` — Minimal layout for password flows

### Batch 7: Auth Screens

**Files to create:**
- `features/auth/schemas.ts` — Zod schemas: loginSchema, passwordResetSchema, passwordResetConfirmSchema, passwordChangeSchema
- `features/auth/login-form.tsx` — `"use client"`. Email/phone field, password with show/hide, handles 401/429/403, "Forgot password?" link
- `features/auth/password-reset-form.tsx` — Single identifier field, always shows success
- `features/auth/password-change-form.tsx` — Current + new + confirm password
- `app/(public)/login/page.tsx` — Renders LoginForm
- `app/(auth)/password-reset/page.tsx` — Renders PasswordResetForm
- `app/(auth)/password-reset/confirm/page.tsx` — Token from URL, new password form
- `app/(auth)/force-change-password/page.tsx` — Force password change (blocks navigation)
- `app/page.tsx` — Redirect to /(app)/home or /(public)/login based on auth state

### Batch 8: People Feature

**Files to create:**
- `hooks/use-persons.ts` — usePersons(params), usePerson(id), useCreatePerson(), useUpdatePerson(), useDeletePerson(), useMergePerson()
- `hooks/use-contacts.ts` — useContacts(entityType, entityId), mutations
- `hooks/use-addresses.ts` — useAddresses(entityType, entityId), mutations
- `features/people/schemas.ts` — Zod schemas for person, contact, address forms
- `features/people/people-list.tsx` — DataTable w/ API trigram search, status filter, columns (Name, Gender, DOB, Status, Phone, Email), cursor pagination, "Add Person" action, empty state
- `features/people/person-form.tsx` — Create/edit form: Personal Info, Demographics, Contact sections. React Hook Form + Zod. version on update.
- `features/people/person-profile.tsx` — Tabbed profile: header (avatar initials, name, DOB, gender, status), merged banner, tabs (Overview, Contacts, Addresses), more menu (merge, delete)
- `features/people/person-contacts.tsx` — Contacts tab: list + add/edit/delete (drawer, no version)
- `features/people/person-addresses.tsx` — Addresses tab: list + add/edit/delete (drawer, version)
- `features/people/contact-form.tsx` — Contact create/edit drawer (type, value, label, is_primary, is_emergency)
- `features/people/address-form.tsx` — Address create/edit drawer (type, line1/2, city, district, state, postal_code, etc.)
- `app/(app)/people/page.tsx` — Renders PeopleList
- `app/(app)/people/[personId]/page.tsx` — Renders PersonProfile

### Batch 9: Academics Feature

**Files to create:**
- `hooks/use-academic-years.ts`, `hooks/use-academic-terms.ts`, `hooks/use-academic-classes.ts`, `hooks/use-subjects.ts`, `hooks/use-class-subjects.ts`, `hooks/use-cohorts.ts`
- `features/academics/schemas.ts` — Zod schemas for all academic forms
- `features/academics/academic-years-list.tsx` — List w/ status filter, "Create Year" action
- `features/academics/academic-year-form.tsx` — name, code, start/end date, is_current, status
- `features/academics/academic-year-detail.tsx` — Year overview + terms for this year
- `features/academics/academic-terms-list.tsx` — Filtered by year, "Create Term" action
- `features/academics/academic-term-form.tsx` — code, name, start/end date, status
- `features/academics/academic-classes-list.tsx` — Status filter, "Create Class" action
- `features/academics/academic-class-form.tsx` — code, name, description, sort_order, status
- `features/academics/subjects-list.tsx` — Type + status filter, "Create Subject" action
- `features/academics/subject-form.tsx` — code, name, description, subject_type, status
- `features/academics/class-subjects-list.tsx` — Filter by class+year, "Assign Subject" action, no PATCH (create+delete only)
- `features/academics/class-subject-form.tsx` — Select class, subject, effective year range
- `features/academics/cohorts-list.tsx` — Filter by year+class, "Create Section" action
- `features/academics/cohort-form.tsx` — code, name, capacity, year, class, status
- `features/academics/cohort-detail.tsx` — Tabs: Overview, Subjects (class-subjects for this class)
- `app/(app)/academics/years/page.tsx`, `app/(app)/academics/years/[yearId]/page.tsx`
- `app/(app)/academics/terms/page.tsx`
- `app/(app)/academics/classes/page.tsx`
- `app/(app)/academics/subjects/page.tsx`
- `app/(app)/academics/cohorts/page.tsx`, `app/(app)/academics/cohorts/[cohortId]/page.tsx`

### Batch 10: Settings Feature

**Files to create:**
- `hooks/use-schools.ts`, `hooks/use-users.ts`, `hooks/use-roles.ts`, `hooks/use-memberships.ts`
- `features/settings/schemas.ts` — Zod schemas
- `features/settings/school-profile.tsx` — Edit form: name, short_name, code (read-only), board, affiliation, email, phone. Advanced section: timezone, locale. School address management. version on update.
- `features/settings/users-list.tsx` — DataTable w/ status badges, "Create User" action
- `features/settings/user-form.tsx` — email, phone, password (create only), link to person
- `features/settings/user-detail.tsx` — User info + memberships + role grants
- `features/settings/roles-list.tsx` — DataTable, system role badges, "Create Role" action
- `features/settings/role-form.tsx` — code, name, scope_level, data_scope, permission selection (grouped by module)
- `features/settings/role-detail.tsx` — Permission matrix grouped by module
- `features/settings/memberships-list.tsx` — User + school + roles, "Grant Access" action
- `features/settings/membership-form.tsx` — Select user, school (or org-wide), assign roles
- `app/(app)/settings/page.tsx` — Redirect to settings/school
- `app/(app)/settings/school/page.tsx`, `users/page.tsx`, `users/[userId]/page.tsx`, `roles/page.tsx`, `roles/[roleId]/page.tsx`, `memberships/page.tsx`

### Batch 11: Dashboard & Global Search

**Files to create:**
- `features/dashboard/dashboard.tsx` — Composed sections
- `features/dashboard/needs-attention.tsx` — Data quality: persons without contacts/addresses, classes without subjects, years without terms, cohorts without capacity, incomplete profiles
- `features/dashboard/quick-actions.tsx` — Add Person, Create Section, Configure Year, Manage Users
- `features/dashboard/metrics.tsx` — Total persons, active sections, active year, total users
- `features/dashboard/activity-placeholder.tsx` — "Recent activity will appear here" empty state
- `app/(app)/home/page.tsx` — Renders Dashboard
- Wire command-palette into header (already created in Batch 6)

### Batch 12: Backend Changes

**Files to modify in `../school-os-api`:**

1. **`app/modules/auth/schemas.py`** — Add `must_change_password: bool = False` to `MeResponse`
2. **`app/modules/auth/router.py`** — Include `must_change_password=user.must_change_password` in the MeResponse construction in the `/me` endpoint
3. **Add audit log read endpoint** (new files):
   - `app/modules/platform_/audit/schemas.py` — `AuditLogRead`, `AuditLogListParams`
   - `app/modules/platform_/audit/repository.py` — Query with filters (entity_type, entity_id, actor_user_id, school_id, date range), cursor pagination
   - `app/modules/platform_/audit/router.py` — `GET /audit-logs` with cursor pagination
   - Register router in `app/api/v1/router.py`

### Batch 13: Polish & Error Handling

**Files to create:**
- `app/not-found.tsx` — Global 404
- `app/(app)/not-found.tsx` — 404 within app shell
- `app/error.tsx` — Global error boundary (`"use client"`)
- `app/(app)/error.tsx` — App error boundary
- `app/(app)/home/loading.tsx` — Dashboard skeleton
- `app/(app)/people/loading.tsx` — People list skeleton
- `hooks/use-unsaved-changes.ts` — beforeunload + router guard for dirty forms
- `components/patterns/offline-banner.tsx` — "You are offline" using navigator.onLine

---

## Verification Plan

1. **Backend:** Run `pytest` to verify backend changes don't break existing tests
2. **Frontend build:** `npm run build` — no TypeScript errors
3. **Auth flow:** Login → see dashboard → logout → redirect to login
4. **Password reset:** Request reset → confirm with token
5. **Context:** School selector shows accessible schools, year selector auto-selects current
6. **People CRUD:** Create person → view profile → add contact → add address → edit → delete
7. **Academics CRUD:** Create year → add terms → create classes → add subjects → assign subjects to classes → create sections
8. **Settings:** Edit school profile → create user → create role → grant membership → manage roles
9. **Permissions:** Login as a user with limited permissions → verify nav items hidden, actions blocked
10. **Search:** ⌘K → search persons, navigate from results
11. **Error handling:** Invalid form → see field errors. Concurrent edit → STALE_RESOURCE dialog. No permission → 403 page.
12. **Responsive:** Test mobile layout — bottom nav, card tables, touch targets
13. **Data quality:** Dashboard shows alerts for persons without contacts, classes without subjects, etc.
