# School OS — Frontend Architecture

## Purpose

Define the structural architecture for the School OS web portal.

The frontend should present a simple, modern, task-oriented experience while the backend handles organizations, schools, academic years, enrollments, roles, permissions, and future modules.

> The backend models complexity; the frontend hides complexity.

## Implementation Phases

The architecture covers the full product vision, but the API delivers capabilities in phases. Build the frontend shell and patterns once, then populate modules as the API supports them.

### Phase 1 — Foundation (current API)
Auth, IAM (organizations, schools, users, memberships, roles), People (persons, addresses, contacts), Academics (years, terms, classes, subjects, class-subjects, cohorts).

> Audit log entries are written server-side in every mutation transaction. The `/audit-logs` read endpoint is available with cursor pagination and filters by entity_type, entity_id, actor_user_id, school_id, and date range.

### Phase 2 — Core Operations (planned)
Student enrollment, staff employment, attendance, guardian relationships, fee accounts, admissions workflow.

### Phase 3 — Extended Modules (planned)
Timetable, homework, exams, communication, calendar, reports, transport, library, inventory.

Sections marked *(future)* below depend on API capabilities not yet available. Design for them structurally but do not build UI until the API is ready.

## Experience Model

The portal is organized around:

```text
Context
  ↓
Workspace
  ↓
Action
  ↓
Workflow
  ↓
Insight
  ↓
History
```

### Context
- Organization
- School
- Academic Year
- Optional Academic Term / Cohort context

### Workspace
- Student
- Staff
- Cohort
- School
- Admission *(future)*
- Fee account *(future)*

### Action
- Add person (student/staff)
- Create cohort
- Configure academic year
- Manage roles and memberships
- Mark attendance *(future)*
- Record payment *(future)*
- Create announcement *(future)*

### Workflow
- School setup
- Student onboarding (Person → Admission → Enrollment) *(partially future)*
- Staff onboarding *(future)*
- Transfer *(future)*
- Promotion *(future)*
- Approval *(future)*
- Bulk import *(future)*

### Insight
- Dashboard (counts + data quality + activity timeline via /audit-logs)
- Alerts
- Reports *(future)*
- Analytics *(future)*
- Data quality

### History
- Audit log (available via /audit-logs)
- Enrollment history *(future)*
- Activity
- Communication history *(future)*

## Application Structure

Use one Next.js application initially.

```text
school-os-portal/
├── app/
│   ├── (public)/
│   │   └── login/
│   ├── (auth)/
│   │   ├── password-reset/
│   │   ├── password-reset/confirm/
│   │   └── force-change-password/
│   └── (app)/
│       ├── home/
│       ├── people/
│       │   ├── [personId]/                   ← unified person profile (Phase 1)
│       │   ├── students/                     ← (future: filtered by enrollment)
│       │   │   └── [personId]/
│       │   ├── guardians/                    ← (future: guardian relationships)
│       │   └── staff/                        ← (future: filtered by employment)
│       │       └── [personId]/
│       ├── academics/
│       │   ├── years/
│       │   │   └── [yearId]/
│       │   ├── terms/
│       │   ├── classes/
│       │   ├── cohorts/
│       │   │   └── [cohortId]/
│       │   └── subjects/
│       ├── attendance/                       ← (future)
│       ├── timetable/                        ← (future)
│       ├── homework/                         ← (future)
│       ├── exams/                            ← (future)
│       ├── fees/                             ← (future)
│       ├── admissions/                       ← (future)
│       ├── communication/                    ← (future)
│       ├── reports/                          ← (future)
│       └── settings/
│           ├── school/
│           ├── academic/
│           ├── users/
│           │   └── [userId]/
│           ├── roles/
│           │   └── [roleId]/
│           ├── memberships/
│           ├── organization/                  ← platform admin only
│           └── audit/                         ← /audit-logs (available)
├── components/
│   ├── ui/                 ← design system primitives
│   ├── layout/             ← shell, sidebar, header, breadcrumb
│   └── patterns/           ← page-header, empty-state, error-boundary, data-table
├── features/
│   ├── auth/
│   ├── people/
│   ├── academics/
│   └── settings/
├── entities/
│   ├── person/
│   ├── school/
│   ├── academic-year/
│   ├── cohort/
│   └── user/
├── workflows/
│   ├── school-setup/
│   └── student-onboarding/ ← (future)
├── services/
│   ├── api-client.ts       ← Axios/fetch wrapper with interceptors
│   ├── auth.ts
│   └── generated/          ← OpenAPI-generated types and client
├── hooks/
│   ├── use-auth.ts
│   ├── use-school-context.ts
│   ├── use-permissions.ts
│   └── use-cursor-pagination.ts
├── lib/
│   ├── constants.ts
│   ├── utils.ts
│   └── permissions.ts
├── providers/
│   ├── auth-provider.tsx
│   ├── school-context-provider.tsx
│   └── query-provider.tsx
└── types/
```

Responsibility:

```text
entities   → reusable domain representations (cards, badges, inline displays)
features   → user-facing capabilities (list, detail, create, edit for a domain)
workflows  → multi-step business processes (wizards, guided flows)
components → reusable UI (design system + layout + patterns)
services   → API integration (client, interceptors, generated types)
providers  → React context providers (auth, school context, query client)
hooks      → shared stateful logic
app        → route/page composition (thin — delegates to features/workflows)
```

Do not organize the entire frontend directly around database tables.

## Application Shell

Desktop:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ SchoolOS │ School ▼ │ 2026–27 ▼ │ Search (⌘K) │ Notifications │ User   │
├──────────┬──────────────────────────────────────────────────────────────┤
│ Home     │ Breadcrumb                                                   │
│ People   │ Page title                                  Primary action    │
│ Academics│─────────────────────────────────────────────────────────────│
│ Operations│                         Workspace                            │
│ Finance  │                                                              │
│ Admissions│                                                            │
│ Communication                                                           │
│ Insights │                                                              │
│ Settings │                                                              │
└──────────┴──────────────────────────────────────────────────────────────┘
```

The sidebar renders only the sections available to the current user's permissions. Sections for future modules should not appear until the corresponding API is available.

Mobile should replace the sidebar with compact navigation and contextual actions.

## Context System

Authenticated sessions have:

```text
Organization
  ↓
Active School
  ↓
Academic Year
```

Optional deeper context:

```text
Academic Term
Cohort
Student / Staff workspace
```

### How context maps to the API

The frontend sends the active school ID to the API via the `X-School-ID` header on every authenticated request. The API client interceptor must attach this header automatically based on the selected school context.

The school selector in the top bar:
1. Fetches the user's identity from `/auth/me` (returns `user_id`, `person_id`, `email`, `phone`, `is_platform_admin`, `organization_id`, `school_id`, `role_codes[]`, `permissions[]`). Note: `school_id` here is the membership's default school, not a list.
2. Fetches the user's memberships from `/memberships?user_id={me.user_id}` to determine all accessible schools.
3. If the user has only one accessible school, auto-select it and hide the selector.
4. If the user has multiple schools (including org-wide memberships where `school_id = null` that grant access to all schools), show the selector dropdown.
5. Persist the selected school in local storage and restore on reload.

Academic year context works similarly — fetch available years for the active school from `/academic-years` and auto-select the current year (`is_current = true`).

Preserve context during related navigation so users are not repeatedly asked to choose the same school, year, cohort, or workspace.

### Multi-school users

Users with org-wide memberships (`school_id = null`) have access to all schools in the organization. The school selector must list all schools from `/schools` for these users.

When switching schools, invalidate all school-scoped cached data (academic years, terms, classes, cohorts, subjects, persons list) but preserve org-scoped data.

## Information Architecture

```text
Home

People
  All People                  ← all persons in the school
  Students                    ← (future: persons filtered by enrollment — requires enrollment API)
  Guardians                   ← (future: persons linked as guardians)
  Staff                       ← (future: persons filtered by employment — requires employment API)

Academics
  Academic Years
  Terms
  Classes                     ← academic_classes
  Cohorts                     ← cohorts (sections within a class + year)
  Subjects
  Class Subjects              ← subject assignments per class
  Curriculum                  ← (future)
  Timetable                   ← (future)
  Homework                    ← (future)
  Exams & Results             ← (future)

Operations                    ← (future section)
  Attendance
  Calendar
  Events
  Approvals

Finance                       ← (future section)
  Fees
  Payments
  Expenses
  Accounts

Admissions                    ← (future section)
  Enquiries
  Applications
  Verification
  Enrollment

Communication                 ← (future section)
  Inbox
  Announcements
  Campaigns
  Templates
  Delivery

Campus                        ← (future section)
  Transport
  Library
  Inventory
  Documents
  Visitors
  Facilities

Insights                      ← (future section, except Data Quality)
  Reports
  Analytics
  Data Quality

Settings
  School Profile              ← /schools/{id} (includes board, affiliation number)
  Academic Configuration      ← years, terms, classes, subjects
  Users & Roles               ← /users, /roles, /memberships
  Audit                       ← /audit-logs (available)
  Organization                ← /organizations (platform admin only)
  Communication               ← (future)
  Integrations                ← (future)
  Security                    ← (future)
```

Not every role sees every section.

## Role-Based Navigation

The API does not embed role names in the JWT. The frontend resolves permissions from `/auth/me` on login and caches them. Navigation visibility is driven by permission codes, not role labels. The role labels below are conceptual guides — the implementation checks permissions.

### School Admin
Home, People (Students, Staff), Academics, Settings (all).

### Principal
Home, People (Students, Staff), Academics, Settings (read-only).

### Teacher *(future — requires teacher assignment model)*
Home, My Classes, Attendance, Homework, Exams, Messages.

### Parent *(future — requires guardian relationship model)*
Home, My Children, Attendance, Homework, Exams, Fees, Messages, Calendar.

### Student *(future — requires student enrollment model)*
Home, My Classes, Timetable, Homework, Exams, Results, Messages.

Frontend checks improve usability only. Backend permissions remain authoritative.

### Permission-driven visibility

Map navigation items to permission codes:

```text
People         → people.person.list
Academics      → academic.academic_year.list
Settings       → iam.school.read
Users & Roles  → iam.user.list, iam.role.list
Memberships    → iam.membership.list
Audit          → people.person.list (audit log available via /audit-logs)
Organizations  → iam.organization.list (platform admin only)
```

Hide navigation items when the user lacks the corresponding `list` or `read` permission. Never show a nav item that leads to a 403.

## Workspaces

### Student

```text
Overview        ← person details, contacts, addresses
Academics       ← (future: enrollment, placement, subjects)
Attendance      ← (future)
Fees            ← (future)
Documents       ← (future)
Communication   ← (future)
History         ← audit log available via /audit-logs
```

### Staff

```text
Overview        ← person details, contacts, addresses
Assignments     ← (future: employment, class assignments)
Timetable       ← (future)
Classes         ← (future)
Attendance      ← (future)
Documents       ← (future)
History         ← audit log available via /audit-logs
```

### Cohort

```text
Overview        ← cohort details, capacity, class, year
Students        ← (future: enrolled students)
Subjects        ← class subjects for the cohort's academic class
Teachers        ← (future: assigned teachers)
Attendance      ← (future)
Timetable       ← (future)
Homework        ← (future)
Exams           ← (future)
```

## People: Student vs Staff Distinction

> **Current limitation:** The `Person` model has no `type` or `category` field. There is no enrollment or employment API yet. The API returns all persons for a school without distinguishing students from staff.

**Phase 1 approach:**
- Show a single "People" list with all persons. Do not create separate "Students" and "Staff" views yet.
- The person profile page is unified — the same detail view serves all person types.
- Once enrollment and employment APIs are available (Phase 2), add filtered views ("Students" = persons with active enrollment, "Staff" = persons with active employment).

**Person fields available now:** `first_name`, `middle_name`, `last_name`, `preferred_name`, `date_of_birth`, `gender`, `blood_group`, `nationality`, `primary_phone`, `primary_email`, `status` (ACTIVE/INACTIVE/DECEASED/MERGED), `custom_fields` (JSONB), `address_id`.

**Person merge:** Available now via `POST /persons/{person_id}/merge` with `{ target_person_id, version }`. The source person's status becomes MERGED and `merged_into_person_id` is set. The frontend should handle this status by showing a banner linking to the target person.

## Global Search / Command Center

Support:

- Entity search (persons via `/persons?search=`, schools, cohorts)
- Action search
- Direct actions from results

Example:

```text
Rahul Sharma
Person · Staff · Science Department

Open profile
Edit details
View contacts
View history
```

Also expose frequent actions such as Add Person, Create Cohort, Configure Academic Year, and Manage Users.

Search uses the API's trigram search on the `/persons` endpoint. For other entities, search the client-side cached list or add API search support as needed.

## Dashboard Architecture

Prioritize:

```text
1. Needs Attention (data quality issues, incomplete profiles)
2. Today's Activity (recent audit log entries)
3. Quick Actions (add person, create cohort, configure year)
4. Important Metrics (student count, staff count, cohort count)
5. Trends (future)
6. Recent Activity (audit log timeline)
```

Dashboards are role-specific and should not become KPI walls.

For Phase 1, the dashboard can be built from:
- Counts from list endpoints (persons, cohorts, users)
- Data quality checks (persons without contacts, classes without subjects, years without terms)

Recent activity from audit logs is available via `GET /audit-logs`. Dashboard activity widgets can now be built.

## Cross-Module Attention

Centralize actionable exceptions:

- Person without contact information
- Person without address
- Academic class without subjects (no class-subject links)
- Cohort without capacity set
- Academic year without terms
- Incomplete person profile (missing DOB, gender)
- Duplicate person candidates (future: person merge)
- Missing guardian information *(future)*
- Section without teacher *(future)*
- Pending admission *(future)*
- Fee concession *(future)*

Each alert should link directly to remediation.

## Approvals *(future)*

Create one approvals inbox for:

- Admissions
- Transfers
- Promotion exceptions
- Fee concessions
- Leave
- Expenses
- Document verification

High-risk actions require review.

## Workflow Architecture

Use the smallest suitable interaction pattern.

### Quick Action
Drawer for small changes (edit person name, update cohort capacity, add a contact).

### Standard Form
Page or modal for ordinary records (create person, create academic year, create cohort).

### Multi-Step Workflow
Wizard for school setup, student onboarding *(future)*, enrollment *(future)*, transfer *(future)*, promotion *(future)*, and bulk import *(future)*.

Workflows must support draft, resume, validation, review, confirmation, and completion.

## Student Onboarding

The API models this as a multi-entity flow:

```text
1. Create Person             ← POST /persons
2. Add Contacts              ← POST /contacts (entity_type=PERSON)
3. Add Address               ← POST /addresses (entity_type=PERSON)
4. Link Guardian             ← (future: guardian relationship API)
5. Create School Admission   ← (future: admission API)
6. Create Enrollment         ← (future: enrollment API)
7. Academic Placement        ← (future: assign to cohort + subjects)
8. Documents                 ← (future: document API)
9. Review & Complete
```

Phase 1 supports steps 1–3. The wizard should allow completing available steps and resuming when more API capabilities are available. Allow incomplete profiles and resume later.

## School Setup

Guided setup wizard:

```text
School profile               ← PATCH /schools/{id} (name, short_name, board, affiliation_number, contact email/phone)
→ Academic year               ← POST /academic-years
→ Terms                       ← POST /academic-terms
→ Classes                     ← POST /academic-classes
→ Subjects                    ← POST /subjects
→ Class subjects              ← POST /class-subjects
→ Cohorts                     ← POST /cohorts
→ Staff                       ← POST /persons + POST /users + POST /memberships
→ Students                    ← POST /persons (future: + enrollment)
→ Optional modules            ← (future)
```

All configuration remains editable later. The wizard tracks progress client-side and can be resumed.

## Data Management

Major lists must support:

- Search (API-backed for persons, client-side for small sets)
- Filters (by status, class, year, term)
- Sort (whitelist: the API supports `created_at` + `id` cursor keys)
- Column selection (client-side preference, persisted in local storage)
- Saved views *(future — client-side initially)*
- Bulk actions *(future)*
- Pagination (cursor-based — see below)
- Export *(future)*

### Cursor Pagination

The API returns `CursorPage<T>`: `{ items[], next_cursor, has_more }`.

The frontend must:
1. Never use offset pagination for large datasets.
2. Pass `cursor` and `limit` query parameters.
3. Show "Load more" or infinite scroll — not page numbers (cursor pagination does not support arbitrary page jumps).
4. Cache loaded pages for back-navigation.

## Bulk Operations *(future)*

For high-impact actions:

```text
Selection
→ Preview
→ Validation
→ Confirmation
→ Processing
→ Result
```

Show success, warning, failure, and recovery information.

## Communication *(future)*

Treat communication as a shared capability:

```text
Inbox
Announcements
Campaigns
Templates
Scheduled
Delivery History
```

Communication records include audience, channel, content, schedule, delivery state, and read state where applicable.

## Notifications *(future)*

Categories:

- Needs Action
- Updates
- Messages
- System

Notifications should be actionable rather than passive.

## Activity / History

> **Blocked:** All audit-based timelines require a read API for the `AuditLog` table. The model exists (with `actor_user_id`, `action`, `entity_type`, `entity_id`, `summary`, `before_snapshot`, `after_snapshot`, `context`, `request_id`, `ip_address`) but no `/audit-logs` endpoint is exposed yet. Design the timeline component now; populate it once the API ships.

Use consistent timelines for:

- Person history (from audit log)
- Enrollment *(future)*
- Audit (dedicated audit log viewer in Settings)
- Communications *(future)*
- Workflow history *(future)*
- Payments *(future)*

The `AuditLog` model stores `before_snapshot` and `after_snapshot` JSONB fields. The timeline component should render these as human-readable change descriptions, not raw JSON.

## Data Quality

Provide a dedicated data quality experience for:

- Missing data (persons without contacts, addresses)
- Duplicate candidates (persons with similar names — use trigram search)
- Academic configuration gaps (classes without subjects, years without terms)
- Cohorts at or over capacity
- Staff conflicts *(future)*

Every issue should have a remediation path (link directly to the edit form for the affected entity).

## Calendar and Timetable *(future)*

Calendar eventually combines:

- Academic terms
- Holidays
- Exams
- Events
- PTMs
- Homework deadlines

Timetable should be visual and support student, teacher, cohort, and admin views.

## Attendance *(future)*

Teacher experience should be context-aware:

```text
Today's Classes
→ Class 8-A Mathematics
→ Take Attendance
```

The UI should already know school, date, teacher, cohort, and subject.

Attendance corrections must preserve audit/history.

Design for future offline synchronization.

## Authentication Flow

### Login

```text
Email/Phone + Password → POST /auth/login → { access_token, refresh_token, token_type, expires_in, user: { id, email, phone } }
```

- Store access token in memory (not localStorage — XSS risk).
- Store refresh token in an httpOnly cookie if using a BFF, or in memory with a short-lived fallback to localStorage.
- On success, call `GET /auth/me` to load permissions and context.
- On 429 (rate limited), show "Too many attempts. Try again in {retry_after} seconds."
- On account locked (403 `ACCOUNT_INACTIVE`), show "Account locked. Contact your administrator."

### Token Refresh

- The API client interceptor should detect 401 responses.
- On 401, attempt `POST /auth/refresh` with the stored refresh token.
- If refresh succeeds, retry the original request with the new access token.
- If refresh fails (token revoked, expired, or family theft detected), redirect to login.
- Use a request queue to avoid multiple simultaneous refresh attempts.

### Force Password Change

> **API gap:** `/auth/me` (MeResponse) does not currently include the `must_change_password` flag. The User model has this field and the password-change service clears it, but it is not exposed in MeResponse. **The API must add `must_change_password: bool` to MeResponse** before the frontend can implement this flow.

- After login, if `/auth/me` returns `must_change_password = true`, redirect to a force-change-password screen.
- Block all other navigation until the password is changed via `POST /auth/password/change`.

### Logout

- Call `POST /auth/logout` with the refresh token.
- Clear all tokens and cached state.
- Redirect to login.

### Password Reset

- `POST /auth/password-reset` — always shows success (no email/phone enumeration).
- `POST /auth/password-reset/confirm` — consumes the token and sets the new password.

## API Client

### Setup

Use a single configured HTTP client (Axios or fetch wrapper) for all API calls.

### Interceptors

1. **Auth header**: Attach `Authorization: Bearer {access_token}` to every request.
2. **School context**: Attach `X-School-ID: {active_school_id}` to every request.
3. **Request ID**: Optionally attach `X-Request-ID` for client-side correlation.
4. **401 handler**: Trigger token refresh flow.
5. **Error normalization**: Parse the API's error envelope (`{ error: { code, message, details } }`) into typed frontend errors.

### Error Handling

The API returns structured errors. The frontend must branch on `error.code`, never on `error.message`:

```text
UNAUTHORIZED         → redirect to login (or refresh)
ACCOUNT_INACTIVE     → show locked account message
FORBIDDEN            → show permission denied page
TENANT_CONTEXT       → show school selector (no school selected)
NOT_FOUND            → show 404 page or toast
VALIDATION_ERROR     → map to form field errors
CONFLICT             → show conflict message (e.g., duplicate code)
STALE_RESOURCE       → show "modified by someone else" with reload option
RATE_LIMITED         → show retry countdown
INTERNAL_ERROR       → show generic error with retry
```

### Optimistic Locking

Most resources require a `version` field on PATCH and DELETE requests. Versioned resources: organizations, schools, persons, academic years, terms, classes, subjects, cohorts, roles, users, memberships, addresses.

**Not versioned:** Contacts (no `version` field — PATCH/DELETE without version), class-subjects (no PATCH — only POST to create and DELETE to remove).

The frontend must:

1. Store the `version` from the last read/list response.
2. Send `version` with every update or delete request.
3. Handle 409 `STALE_RESOURCE` by showing "This record was modified by someone else" with an option to reload and retry.

## Responsive Strategy

Mobile-first:

- Teachers
- Parents
- Students

Desktop-first but responsive:

- Administration
- Principal
- Finance/specialist staff

Do not simply shrink desktop layouts.

## Accessibility

Build into the component system:

- Keyboard navigation
- Focus visibility
- Semantic HTML
- Screen-reader labels
- Accessible dialogs/drawers
- Form error association
- Adequate contrast
- Non-color-only status
- Touch-friendly controls
- Reduced motion considerations

## State Management

Separate:

### Server state
Use TanStack Query (React Query) for all API data. Configure:
- `staleTime`: 30 seconds for frequently changing data (persons, cohorts), 5 minutes for configuration data (academic years, classes, subjects, roles).
- `gcTime`: 10 minutes.
- Invalidate school-scoped queries on school context change.
- Use query keys that include the school ID to prevent cross-school data leaks.

### UI state
Use local state/context for UI-only concerns (sidebar open/closed, active tab, modal state).

### Forms
Use React Hook Form with Zod schemas for validation. Map API validation errors (422 `VALIDATION_ERROR` with per-field details) to form field errors.

### Auth/context
Centralized providers:
- `AuthProvider`: manages tokens, user identity, permissions, login/logout.
- `SchoolContextProvider`: manages active school, academic year, and the `X-School-ID` header.

Do not put all application state into one global store.

## API Gaps Requiring Backend Changes

The following gaps must be resolved in the API before corresponding frontend features can be built:

| Gap | Impact | Required Change |
|-----|--------|-----------------|
| No audit log read endpoint | Blocks: Settings → Audit, person history tabs, dashboard activity feed | Add `GET /audit-logs` with cursor pagination, filters by entity_type, entity_id, actor_user_id, school_id, date range |
| `must_change_password` not in MeResponse | Blocks: force password change flow after login | Add `must_change_password: bool` to `/auth/me` response |
| No person type/category field | Cannot distinguish students from staff | Phase 2: enrollment/employment APIs will provide this distinction |
| Contact has no `version` field | No optimistic locking on contact updates | Low risk for Phase 1; consider adding if concurrent editing becomes an issue |
| ClassSubject has no PATCH | Cannot update effective year range — must delete and recreate | Acceptable for Phase 1 |

## API Contract

FastAPI is the source of truth.

```text
FastAPI
  ↓
OpenAPI spec (GET /openapi.json)
  ↓
Generated TypeScript types (via openapi-typescript)
  ↓
Generated API client (via openapi-fetch or custom)
  ↓
Next.js
```

Run type generation as a build step (`npm run generate:api`). Commit the generated types so that CI does not depend on the running API server. Re-generate when the API changes.

Avoid manually duplicating API types wherever practical. When the generated types are awkward for UI use, create thin UI-specific types that reference or extend the generated ones.

## Design System

Core components:

- Button
- Input
- Select
- Combobox
- Date picker
- Table/DataTable
- Dialog
- Drawer
- Tabs
- Badge
- Alert
- Toast
- Tooltip
- Dropdown
- Command palette
- Breadcrumb
- Page header
- Empty state
- Error state
- Skeleton
- Timeline
- Activity feed
- Stat/metric
- Form sections
- Avatar (for persons)
- Status badge (for entity status: ACTIVE, ARCHIVED, DRAFT, etc.)
- Permission gate (renders children only if user has the required permission)

## Visual Language

Modern, calm, premium, approachable.

Use:

- Neutral surfaces
- White content areas
- One primary brand color
- Restrained semantic colors
- Subtle borders
- Moderate radius
- Strong typography hierarchy
- Consistent spacing

Avoid excessive cards, gradients, colors, and legacy ERP density.

## Performance

Design for variable hardware and connectivity:

- Paginate large lists (cursor-based)
- Virtualize very large lists
- Lazy-load heavy modules
- Optimize images
- Cache server state (TanStack Query)
- Avoid unnecessary refetches (use `staleTime`)
- Keep client bundles reasonable
- Use skeletons
- Preserve useful navigation/filter state

## Future Extensibility

The architecture must support future modules without changing the core shell:

- Admissions
- Fees
- HR
- Transport
- Library
- Inventory
- Documents
- Analytics
- Automation
- AI
- Integrations

New modules should add routes, features, permissions, navigation metadata, and workflows without duplicating shell infrastructure.

### Adding a new module

1. Add route group under `app/(app)/`.
2. Add feature directory under `features/`.
3. Add entity representations under `entities/` if the module introduces new domain objects.
4. Register navigation items with permission requirements in the sidebar configuration.
5. Add generated API types from the OpenAPI spec.
6. No changes to the shell, providers, or core hooks.

## Final Principle

> Users should not need to understand the school database or backend architecture.

Every important screen should make four things obvious:

1. Where am I?
2. What am I looking at?
3. What can I do?
4. What should I do next?
