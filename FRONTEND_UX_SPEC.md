# School OS — Frontend UX Specification

## Experience Goal

School OS should feel like a modern productivity platform, not a traditional ERP.

The product should be:

- Simple
- Calm
- Predictable
- Fast
- Context-aware
- Action-oriented
- Role-specific
- Mobile-friendly
- Accessible

> Do not expose backend complexity to users.

## Core UX Principles

1. Context before configuration.
2. Tasks before modules.
3. One clear primary action per screen.
4. Preserve context during navigation.
5. Progressive disclosure over giant forms.
6. Prefer reversible actions.
7. Confirm high-risk actions.
8. Explain empty states.
9. Make errors recoverable.
10. Do not repeatedly ask for known context.
11. Advanced features stay hidden until needed.
12. Use consistent interaction patterns.

## Global Shell

The shell always provides:

- Active school (selector — auto-hidden for single-school users)
- Academic year (selector — auto-selects current year)
- Global search (⌘K / Ctrl+K)
- Notifications *(future — placeholder icon until API supports it)*
- User menu (profile, change password, switch school, logout)
- Breadcrumbs
- Role-aware navigation (driven by permission codes, not role labels)

### User Menu

The user menu should show:

- User's name and email (from `/auth/me`)
- Active role context (e.g., "School Admin at Delhi Public School")
- Switch school (if multi-school access)
- Change password
- Preferences *(future)*
- Logout

### School Selector

- If the user has access to one school: display the school name as static text, no dropdown.
- If the user has access to multiple schools: show a dropdown with search. Group by organization if the user spans multiple organizations.
- On school change: invalidate all school-scoped data, re-fetch academic years, select the current year.

## Home

Home is an action center, not a collection of statistics.

Priority:

```text
Needs Attention
↓
Today's Activity
↓
Quick Actions
↓
Important Metrics
↓
Trends
↓
Recent Activity
```

### Phase 1 Home

For the current API capabilities, the home screen should show:

**Needs Attention** — Data quality issues:
- Persons without any contact information (no Contact records with entity_type=PERSON)
- Persons without addresses (no Address records with entity_type=PERSON)
- Academic classes without subjects assigned (no ClassSubject links)
- Academic year without terms defined
- Cohorts without capacity set
- Persons with incomplete profiles (missing DOB, gender)

**Quick Actions** — Contextual shortcuts:
- Add a person
- Create a cohort
- Configure the current academic year
- Manage users and roles

**Important Metrics** — Counts:
- Total persons (no student/staff distinction available yet — see note below)
- Active cohorts for current year
- Active academic year status
- Total users and memberships

> **Note:** The Person model has no type/category field. Separate student and staff counts require enrollment/employment APIs (Phase 2). For Phase 1, show total person count.

**Recent Activity** — *(Blocked: no audit log read API yet)*
- Design the activity feed component and wire it up once `/audit-logs` is available.
- Placeholder: show a "Recent activity will appear here" empty state.

## Person Profile (Student 360 / Staff Profile)

> **Phase 1 note:** There is no student/staff distinction in the current API. The Person model has no type field, and enrollment/employment APIs do not exist yet. Phase 1 shows a unified person profile. Separate "Student 360" and "Staff Profile" views will be differentiated when enrollment and employment data are available.

Person profile should expose:

- Identity (name, preferred name, DOB, gender, blood group, nationality — from Person)
- Contact information (phone, email, WhatsApp — from Contacts, polymorphic on entity_type=PERSON)
- Addresses (residential, permanent — from Addresses, polymorphic on entity_type=PERSON)
- Primary phone and email (inline on Person record — `primary_phone`, `primary_email`)
- Custom fields (JSONB — school-defined extra fields)
- Current school enrollment *(future)*
- Academic placement *(future)*
- Guardians *(future)*
- Subjects *(future)*
- Attendance *(future)*
- Fees *(future)*
- Documents *(future)*
- Communication *(future)*
- History *(blocked: no audit log read API yet)*

Use tabs for related categories while preserving a coherent profile header.

### Profile Header

Always visible regardless of active tab:

**Phase 1** (no enrollment data):
```text
┌──────────────────────────────────────────────────────────────┐
│ [Avatar]  Rahul Sharma                          [Edit] [···] │
│           DOB: 15 Mar 2010 · Gender: Male                     │
│           Status: Active                                      │
├──────────────────────────────────────────────────────────────┤
│ Overview │ Contacts │ Addresses │ ...                         │
└──────────────────────────────────────────────────────────────┘
```

**Phase 2+** (with enrollment data — future):
```text
┌──────────────────────────────────────────────────────────────┐
│ [Avatar]  Rahul Sharma                          [Edit] [···] │
│           Class 10-A · Roll #23 · Adm #1023                  │
│           Status: Active                                      │
├──────────────────────────────────────────────────────────────┤
│ Overview │ Contacts │ Addresses │ Academics │ History │ ...   │
└──────────────────────────────────────────────────────────────┘
```

The `[···]` menu exposes less common actions: merge person (available now via API), archive, delete (with confirmation).

When a person has `status = MERGED`, show a non-dismissible banner: "This person has been merged into [target person name]" with a link to the target person profile. Hide edit actions for merged persons.

## Staff Profile *(future — requires employment API)*

> In Phase 1, staff and students share the same person profile view. Staff-specific tabs will be added when the employment API is available.

Staff-specific tabs (future):

- Employment *(future)*
- Assignments *(future: classes, subjects)*
- Timetable *(future)*

## Teacher Home *(future)*

Prioritize:

- Today's classes
- Attendance to complete
- Homework to review
- Exams/tasks
- Messages

The normal teaching workflow should require minimal navigation.

## Cohort (Section) Detail

Show:

- Overview (cohort details: class, year, section code, capacity, status — from `/cohorts/{id}`)
- Subjects (class subjects for the cohort's academic class — from `/class-subjects?academic_class_id=`)
- Students *(future: enrolled students list — requires enrollment API)*
- Teachers *(future: assigned teachers — requires employment/assignment API)*
- Attendance *(future)*
- Timetable *(future)*
- Homework *(future)*
- Exams *(future)*

> Phase 1 tabs: Overview and Subjects only. Future tabs remain hidden until their APIs are available.

## Search

Global command search (⌘K) should find entities and actions.

### Entity Search

Uses the API's trigram search (`/persons?search=query`). Results show:

```text
Rahul Sharma
Person · Active
→ Open profile
→ Edit details
→ View contacts
```

For non-person entities (schools, cohorts, academic years), search the client-side cached list.

### Action Search

Exposes frequent actions directly:

```text
"add" → Add Person, Add Cohort, Add Subject, ...
"create" → Create Academic Year, Create Role, ...
"configure" → Configure School, Configure Terms, ...
```

Local table search should remain separate from global search.

## Lists

Standard list anatomy:

```text
Title
Description
Primary action
Search
Filters
Saved views (future)
Bulk actions (future)
Data table
Pagination (cursor-based "Load more")
```

### Phase 1 Lists

| List | Search | Key Filters | API Filter Params | Primary Action |
|------|--------|-------------|-------------------|----------------|
| Persons | API trigram (`?search=`) | Status, Gender | — (client-side) | Add Person |
| Academic Years | Client-side | Status | — | Create Year |
| Academic Terms | Client-side | Year | `?academic_year_id=` | Create Term |
| Academic Classes | Client-side | Status | — | Create Class |
| Subjects | Client-side | Type, Status | — | Create Subject |
| Class Subjects | Client-side | Class, Year | `?academic_class_id=`, `?year_id=` | Assign Subject |
| Cohorts | Client-side | Year, Class, Status | `?academic_year_id=`, `?academic_class_id=` | Create Cohort |
| Users | Client-side | Status | — | Create User |
| Roles | Client-side | Scope | — | Create Role |
| Memberships | Client-side | School, User | `?school_id=`, `?user_id=` | Create Membership |
| Addresses | — | Type | `?entity_type=`, `?entity_id=` (required) | Add Address |
| Contacts | — | Type | `?entity_type=`, `?entity_id=` (required) | Add Contact |

> Addresses and Contacts are shown inline on entity detail pages (person profile, school settings), not as standalone list pages. The `entity_type` and `entity_id` query params are required by the API.

## Filters

Filters should be progressive.

Default view stays simple (show status filter only; hide advanced filters behind a "More filters" control).

Active filters appear as removable chips above the table.

Saved views can preserve common combinations *(future — client-side local storage initially)*.

## Forms

Forms should:

- Group related fields into logical sections (e.g., "Personal Information", "Contact Details")
- Explain required information (mark required fields, show helper text)
- Validate inline (use Zod schemas matching API expectations)
- Preserve entered data (warn on navigation, restore from form state)
- Warn about unsaved changes (beforeunload + Next.js route change guard)
- Avoid database terminology (use "Class" not "academic_class", "Section" not "cohort")
- Send `version` field on updates for versioned resources (optimistic locking)
- Note: Contacts have no `version` field. Class-subjects have no PATCH — only create and delete.

### Form Error Mapping

When the API returns 422 `VALIDATION_ERROR` with per-field details, map each error to the corresponding form field. Show a summary banner at the top for non-field errors.

When the API returns 409 `CONFLICT` (e.g., duplicate code), show the error inline on the conflicting field.

When the API returns 409 `STALE_RESOURCE`, show a dialog: "This record was modified by someone else. Reload to see the latest version?" with Reload and Cancel options.

## Drawers vs Pages

Use drawers for:

- Quick edits (edit person name, update cohort capacity)
- Lightweight creates (add a contact, add an address)
- Small relationship changes (assign subject to class, grant role to membership)

Use dedicated pages for:

- Full profiles (person, cohort, academic year)
- Complex workflows (school setup wizard)
- Large forms (create person with full details)
- Reports *(future)*
- Settings pages

## Workflow UX

All multi-step workflows should show:

- Progress (step indicator: "Step 2 of 7")
- Current step (highlighted, with title and description)
- Required information (clearly marked fields)
- Optional information (collapsible or secondary)
- Next action (prominent "Continue" button)
- Draft state (auto-save to local storage between steps)
- Resume ability (re-entering the workflow restores progress)
- Final review (summary of all entered data before submission)
- Completion state (success message with next actions)

### Step Validation

Validate each step before allowing progression. Use inline validation for individual fields and step-level validation for cross-field rules. Do not submit to the API until the final step — collect all data client-side, then submit in sequence.

### Error During Multi-Step Submit

If a multi-step workflow fails partway through (e.g., person created but address fails):

1. Show which steps succeeded and which failed.
2. Allow retrying the failed step without re-entering previous data.
3. Provide a link to the partially created entity so the user can complete it manually.

## Bulk UX *(future)*

High-impact bulk operations require:

```text
Select
→ Preview
→ Validate
→ Confirm
→ Process
→ Result
```

Show partial success clearly.

## Notifications *(future)*

Use:

```text
Needs Action
Updates
Messages
System
```

Notifications should link to actions/context.

Avoid notification spam.

## Approvals *(future)*

Approval UI must show:

- Request
- Requestor
- Affected entity
- Current state
- Consequence
- Approve
- Reject
- Details
- History

## Empty State

Every empty state includes:

- What is empty
- Why (contextual: "No students have been added yet" not "No records found")
- Recommended next action (button: "Add your first student")

### Phase 1 Empty States

| Context | Message | Action |
|---------|---------|--------|
| Persons list | "No people have been added to this school yet." | "Add a person" |
| Academic years | "No academic years configured." | "Create academic year" |
| Academic terms | "No terms defined for this academic year." | "Create term" |
| Academic classes | "No classes configured for this school." | "Create class" |
| Cohorts | "No sections created for this class and year." | "Create section" |
| Subjects | "No subjects defined for this school." | "Add subject" |
| Class subjects | "No subjects assigned to this class yet." | "Assign subject" |
| Users | "No users have been added." | "Create user" |
| Roles | "No custom roles defined." | "Create role" |
| Memberships | "No school access granted to this user." | "Grant access" |
| Person contacts | "No contact information on file." | "Add contact" |
| Person addresses | "No addresses on file." | "Add address" |
| Audit log | "Activity history will be available soon." | (no action — API not yet available) |

## Error State

Every error communicates:

- What happened (human-readable, based on API `error.code`)
- Whether anything was saved (critical for multi-step workflows)
- How to retry or recover (button: "Try again", "Go back", "Reload")

### Specific Error UX

| API Error Code | UX Response |
|----------------|-------------|
| `UNAUTHORIZED` | Redirect to login (after attempting token refresh) |
| `ACCOUNT_INACTIVE` | Full-page message: "Your account has been locked. Contact your administrator." |
| `FORBIDDEN` | Inline or full-page: "You don't have permission to do this." No technical details. |
| `TENANT_CONTEXT` | Prompt to select a school |
| `NOT_FOUND` | 404 page or "This record no longer exists" with back navigation |
| `VALIDATION_ERROR` | Map to form fields; show summary for non-field errors |
| `CONFLICT` / `DUPLICATE` | Inline on the conflicting field: "This code is already in use" |
| `STALE_RESOURCE` | Dialog: "Modified by someone else. Reload?" |
| `RATE_LIMITED` | Toast with countdown: "Too many attempts. Try again in {n} seconds." |
| `INTERNAL_ERROR` | Generic: "Something went wrong. Please try again." with retry button |

## Loading

Use skeletons for structural content (page layouts, card grids, table rows).

Use spinner for in-flight mutations (button loading state).

Use progress indicators for long operations *(future: bulk imports)*.

Never show a meaningless blank screen.

### Skeleton Strategy

- Page-level skeleton: render the shell (sidebar, header, breadcrumb) immediately; skeleton the content area.
- Table skeleton: render headers immediately; skeleton 5–10 rows.
- Profile skeleton: render tab bar immediately; skeleton the active tab content.
- Form skeleton: render section headers immediately; skeleton form fields.

## Success

Success feedback should confirm what happened and provide the next useful action.

Examples:
- "Person created." → "Add another" / "View profile" / "Add contact information"
- "Section updated." → "View section" / "Back to list"
- "Academic year configured." → "Add terms" / "Create classes"
- "Subject assigned to class." → "Assign another" / "View class"
- "Role granted." → "View membership" / "Back to users"
- "Contact added." → "Add another" / "Back to profile"

Use undo for safe reversible actions *(future — requires API soft-delete support with undo window)*.

## Validation

Use:

- Field-level messages (inline, below the field, in red/error color)
- Summary message for multi-field errors (banner at top of form)
- Inline guidance where useful (helper text below fields: "Must be unique within this school")

### Client-Side vs Server-Side

- **Client-side** (Zod): Required fields, format validation (email, phone), date ranges, string length limits. Provides instant feedback.
- **Server-side** (API 422): Uniqueness constraints (duplicate codes), cross-entity validation, business rules. Displayed after submission.

Both must be handled. Client-side validation is a UX optimization, not a replacement for server-side validation.

## Permission Denied

Use a human-readable permission page rather than a raw HTTP error.

```text
┌──────────────────────────────────────────┐
│         You don't have access            │
│                                          │
│  You don't have permission to view       │
│  this page. Contact your administrator   │
│  if you think this is a mistake.         │
│                                          │
│  [Go to Home]                            │
└──────────────────────────────────────────┘
```

Never expose permission codes, role names, or technical details to the user.

## Unsaved Changes

Warn before navigation if user input would be lost.

Implement via:
- `beforeunload` event (browser tab close / URL change)
- Next.js router event interception (in-app navigation)
- Custom `useUnsavedChanges` hook that tracks form dirty state

The warning dialog should say: "You have unsaved changes. Leave without saving?" with "Stay" (primary) and "Leave" (secondary) actions.

## Connectivity

If connection is lost:

- Show a visible but non-disruptive status bar: "You are offline. Changes will not be saved."
- Never claim a mutation succeeded without server confirmation.
- Provide retry/recovery (automatic retry with exponential backoff for failed queries).
- Disable mutation buttons while offline.

## Users, Memberships & Roles

### User Management Flow

Creating a user and granting school access is a multi-step process:

1. **Create User** — `POST /users` with email/phone and password. Optionally link to an existing person via `person_id`.
2. **Create Membership** — `POST /memberships` with `user_id`, `school_id` (null for org-wide), and optional `role_ids[]`.
3. **Grant Additional Roles** — `POST /memberships/{id}/roles` with `role_id`, optional `expires_at` and `data_scope`.
4. **Revoke Role** — `DELETE /memberships/{id}/roles/{role_id}`.

The Settings → Users page should show:
- User list with status badges (Invited, Active, Suspended, Disabled)
- Each user's memberships and role grants
- Quick actions: create user, grant access, manage roles

### Role Management

Roles have a `scope_level` (PLATFORM, ORGANIZATION, SCHOOL) and a `data_scope` (OWN, ASSIGNED, SCHOOL, ORGANIZATION, PLATFORM). System roles (`is_system = true`) are read-only.

The role detail page should show the role's permission codes grouped by module (iam, people, academic). Use the permission code format `module.resource.action` to create a readable permission matrix.

## School Settings

The school profile page (Settings → School Profile) should expose all editable school fields:

- **Identity:** Name, short name, code (read-only after creation)
- **Affiliation:** Board (CBSE, ICSE, State, etc.), affiliation number
- **Contact:** Email, phone
- **Address:** Managed via the polymorphic Address API (entity_type=SCHOOL)
- **Status:** SETUP → ACTIVE → SUSPENDED → CLOSED (read-only display; status transitions may be admin-controlled)

The school also has `timezone`, `locale`, and `settings` (JSONB) — expose these under an "Advanced" collapsible section.

## Organization Settings *(platform admin only)*

Platform admins can manage organizations via `/organizations`. Show:

- Organization name, legal name, code
- Contact email, phone
- Plan code and entitlements (read-only display)
- Status (TRIAL → ACTIVE → SUSPENDED → CLOSED)
- Timezone, locale, settings

This section is only visible to users with `is_platform_admin = true`.

## Login UX

### Login Page

```text
┌──────────────────────────────────────────┐
│              School OS                    │
│                                          │
│  Email or Phone                          │
│  [________________________]              │
│                                          │
│  Password                                │
│  [________________________] [Show/Hide]  │
│                                          │
│  [        Sign In        ]               │
│                                          │
│  Forgot password?                        │
└──────────────────────────────────────────┘
```

- Accept both email and phone in a single field.
- Show/hide password toggle.
- On 429: "Too many login attempts. Please try again in {retry_after} seconds." Disable the button with a countdown.
- On account locked (403 `ACCOUNT_INACTIVE`): "Your account has been locked due to too many failed attempts. It will unlock automatically, or contact your administrator."
- On invalid credentials (401): "Invalid email/phone or password." (uniform — no enumeration).
- On success: store `access_token` in memory, `refresh_token` per security strategy. The response also includes `user: { id, email, phone }` and `expires_in` (seconds).

### Password Reset

- "Forgot password?" link on login page.
- Request form: single email/phone field.
- Always show success: "If an account exists with this email/phone, you will receive reset instructions." (no enumeration).
- Confirm form: token (from URL), new password, confirm password.
- On success: "Password reset. You can now sign in." with link to login.

### Force Password Change

> **API gap:** `must_change_password` is not currently included in the `/auth/me` response. The API must add this field before this flow can be implemented. See FRONTEND_ARCHITECTURE.md for details.

- Shown after login when `must_change_password = true` (once API exposes it).
- Current password + new password + confirm password.
- Blocks all other navigation.
- On success: redirect to home.

## Mobile UX

Teachers, parents and students are mobile-first.

Use:

- Bottom navigation (4–5 top-level items max)
- Sticky primary action (FAB or bottom bar button)
- Large touch targets (minimum 44x44px)
- Simplified tables (card layout or single-column list on mobile)
- Contextual actions (swipe or long-press menus)
- Shorter forms (one field per row, larger inputs)

Admin experiences remain desktop-friendly.

### Mobile Shell

Replace the desktop sidebar with:
- Bottom tab bar (Home, People, Academics, Settings)
- Swipe-down for school/year context
- Hamburger menu for less frequent items

## Accessibility

All UI must support:

- Keyboard navigation (Tab, Shift+Tab, Enter, Escape, Arrow keys)
- Focus visibility (visible focus ring on all interactive elements)
- Screen readers (ARIA labels, live regions for toasts/alerts)
- Semantic labels (proper heading hierarchy, landmark regions)
- Accessible form errors (aria-describedby linking error to field)
- Sufficient contrast (WCAG 2.1 AA: 4.5:1 text, 3:1 UI elements)
- Accessible dialogs (focus trap, Escape to close, return focus on close)
- Touch targets (minimum 44x44px)
- Reduced motion (respect `prefers-reduced-motion`, disable animations)

## Terminology

Use user-facing school language.

Examples:

```text
person                        → Person (or Student/Staff based on context, once distinguishable)
academic_class                → Class
cohort                        → Section
academic_year                 → Academic Year
academic_term                 → Term
subject                       → Subject
class_subject                 → Subject Assignment
membership                    → Access / School Access
membership_role               → Role Grant
role                          → Role
organization                  → Organization
user                          → User Account
contact (entity)              → Contact Information
address (entity)              → Address
person.status = ACTIVE        → "Active"
person.status = INACTIVE      → "Inactive"
person.status = DECEASED      → "Deceased"
person.status = MERGED        → "Merged with [target person name]"
school.status = SETUP         → "Setting up"
school.status = ACTIVE        → "Active"
school.status = SUSPENDED     → "Suspended"
user.status = INVITED         → "Invited"
user.status = ACTIVE          → "Active"
user.status = SUSPENDED       → "Suspended"
user.status = DISABLED        → "Disabled"
subject_type = CORE           → "Core"
subject_type = OPTIONAL       → "Optional"
subject_type = ELECTIVE       → "Elective"
subject_type = PRACTICAL      → "Practical"
subject_type = CO_CURRICULAR  → "Co-curricular"
subject_type = ACTIVITY       → "Activity"
STALE_RESOURCE error          → "Modified by someone else"
CONFLICT error                → "Already exists"
TENANT_CONTEXT error          → "Please select a school"
```

Do not expose table or implementation names. Never show ULID IDs in the UI — use human-readable identifiers (admission number, roll number, school code) where available.

## Feedback Patterns

### Reversible
Toast + Undo *(future — when API supports undo window)*.

### Normal save
Success toast + contextual next action.

Example: "Person created successfully." with "View profile" and "Add another" actions in the toast.

### Long-running process
Progress view *(future: bulk imports, promotions)*.

### Destructive operation
Confirmation dialog with consequence explanation.

Example: "Delete this person? This action cannot be undone. All associated contacts and addresses will also be removed." with "Cancel" (primary) and "Delete" (destructive secondary).

### Partial failure
Summary + failed records *(future: bulk operations)*.

### Conflict / Stale Data
Reload dialog: "This record was updated by someone else. Would you like to reload with the latest changes?"

## Context Preservation

Preserve where reasonable:

- School (local storage)
- Academic year (local storage, per school)
- Cohort (URL parameter)
- Search (URL parameter)
- Filters (URL parameters)
- Tab (URL parameter)
- Scroll position (browser default + restore on back navigation)

Returning to a page should not unexpectedly reset the user's work.

### URL-Driven State

Filters, search, sort, and active tabs should be reflected in the URL so that:
- Users can bookmark filtered views.
- Browser back/forward works correctly.
- Sharing a URL shares the same view.

## UX Quality Standard

For every major workflow:

- A new user should understand the screen.
- A trained user should complete the task quickly.
- The common path should be the easiest path.
- Sensitive actions should be safe.
- Errors should be recoverable.
- Context should always be clear.
- The next action should be obvious.

## Feature Completion Checklist

Before frontend work is considered complete:

- Navigation placement reviewed
- Role/permission visibility reviewed
- Permission behavior reviewed (no nav items leading to 403)
- Loading state implemented (skeleton, not blank)
- Empty state implemented (with explanation and next action)
- Error state implemented (mapped from API error codes)
- Success state implemented (with contextual next action)
- Validation implemented (client-side Zod + server-side error mapping)
- Optimistic locking handled (`version` field sent on versioned resources, `STALE_RESOURCE` caught; note: Contacts are not versioned)
- Unsaved changes handled (beforeunload + router guard)
- Responsive layout tested (mobile for teacher/parent/student flows)
- Accessibility reviewed (keyboard, screen reader, contrast)
- Search/filter behavior reviewed
- Bulk behavior reviewed *(future — skip for Phase 1)*
- Audit/history considered (timeline tab on entity profiles — blocked until audit read API ships)
- Mobile behavior reviewed
- API failures handled (all error codes mapped)
- Cursor pagination working (no offset pagination for large lists)
- Context preservation working (school, year, filters in URL/storage)
