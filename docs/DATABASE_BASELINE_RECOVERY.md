# E-School database baseline recovery

## Purpose

This note records the database dependencies visible in the current application
source and explains why the committed migrations must not be treated as a
complete fresh-install schema. It is a recovery inventory, not a migration and
not permission to modify a live database.

## Repository and backend observations

- Application: Next.js 15, React 19, TypeScript, Supabase Auth/Postgres.
- Current configured Supabase project reference in `.env.example`:
  `ialobcshxbesmncngixx`.
- The currently connected Supabase workspace does not expose that project.
  Its current existence, ownership, migration history, backups and data status
  therefore remain unverified from this connection.
- The repository contains only two committed migrations:
  - `20260827_strengthen_immutable_audit_ledger.sql`
  - `20260828_access_integrity_constraints.sql`
- The first migration explicitly describes itself as production hardening and
  depends on pre-existing `audit_logs`, `user_school_roles`,
  `current_user_is_super_admin()`, and other database objects. It is not a
  baseline schema.
- The second migration adds indexes only when selected tables/columns already
  exist. It does not create the underlying academic schema.

**Do not apply these two migrations to a new/empty project as a substitute for
recovering the original baseline. Do not reset, truncate, or reseed the
existing project.**

## Database objects referenced by the inspected server-side application

The following inventory was extracted from the API route handlers and shared
server-side libraries on the current `main` branch. It is a source-derived
dependency list, not proof that each object exists in the live database.
Page-level client queries, views, triggers, policies, foreign keys, enum types,
and indirect dependencies may add further objects.

### Identity, tenancy and platform administration

- `profiles`
- `schools`
- `user_school_roles`
- `school_applications`
- `platform_settings`
- `audit_logs`

### School operations and academic structure

- `academic_years`
- `terms`
- `class_levels`
- `classes`
- `subjects`
- `students`
- `student_enrollments`
- `guardians`
- `student_guardians`
- `teachers`
- `teacher_assignments`
- `class_timetable_entries`
- `school_calendar_events`

### Assessment, attendance and results

- `assessment_categories`
- `assessments`
- `student_scores`
- `grading_scales`
- `grade_bands`
- `student_subject_results`
- `report_cards`
- `report_card_subjects`
- `attendance_sessions`
- `attendance_records`
- `teacher_remarks`

### Communications and support

- `announcements`
- `announcement_notifications`
- `support_tickets`
- `support_ticket_messages`

### Subscription and billing administration

- `subscription_plans`
- `school_subscriptions`
- `subscription_payments`

### Referenced database function

- `refresh_assessment_reminders()`

### Additional constraints implied by hardening migrations

The committed hardening migrations also reference:
- `student_guardians(school_id, student_id, guardian_id)`
- `student_enrollments(school_id, student_id, academic_year_id, enrollment_status)`
- `student_scores(school_id, assessment_id, student_id)`
- `report_cards(school_id, student_id, academic_year_id, term_id, class_id)`
- `attendance_sessions(school_id, academic_year_id, term_id, class_id, attendance_date)`
- `attendance_records(attendance_session_id, student_id)`
- `user_school_roles(user_id, school_id, role, is_active, created_at)`

## Recovery sequence

1. Recover access to the original Supabase project and inspect its migration
   history, schema, RLS policies, grants, functions, triggers, storage buckets,
   Auth configuration and backups.
2. Export a schema-only snapshot and preserve a verified backup before any
   proposed changes. Do not include secrets in GitHub.
3. Compare the live schema against the source-derived inventory above and the
   complete UI/client-side query inventory.
4. Recover the original baseline migration from project history, backups or
   prior repository artifacts where possible.
5. If the original baseline cannot be recovered, reconstruct a fresh-install
   migration set from verified application queries and constraints. Review
   every tenant boundary and role check before applying it anywhere.
6. Test the reconstructed migrations in a separate, empty development project.
   Validate RLS with at least two schools and multiple roles, including
   cross-school negative tests.
7. Only after evidence and approval, plan a non-destructive production
   reconciliation. Never overwrite or recreate a live project merely to make
   migration history look clean.

## Security and implementation review items

- The server-side service-role client bypasses RLS. Every route using it must
  first authenticate the caller, verify the active role, and constrain every
  lookup/write to the caller's authorized school.
- Verify role resolution for users with multiple active schools; the current
  shared helper intentionally blocks ambiguous multi-school access until a
  school-selection workflow exists.
- Review all service-role API routes for cross-tenant ID substitution, not
  just client-side filtering.
- Verify that audit writes cannot fail silently on critical mutations and that
  protected audit tables/functions are deployed consistently.
- Verify the `refresh_assessment_reminders()` function and its execution
  permissions before enabling the related platform setting.
- Confirm the production Vercel environment points to the intended Supabase
  project and uses a server-only service-role secret.

## Current status

- Source-derived server-side object inventory: recorded.
- Original Supabase project access from the current connection: unavailable.
- Original database baseline migration in this repository: missing.
- Live schema and migration history: not verified.
- New database project or migrations applied: none.
- Production data changed: none.
