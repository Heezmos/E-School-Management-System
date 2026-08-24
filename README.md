# E-School Management System

E-School is a multi-tenant education management SaaS platform built with Next.js, TypeScript, and Supabase. It is designed to connect platform administrators, schools, teachers, parents/guardians, and students through secure role-based portals.

## Current build

The repository contains the integrated v3 application source, including:

- Supabase authentication and session handling
- Backend-controlled role routing
- Multi-school tenant-aware access
- Premium responsive School Admin interface
- Student records and student creation
- Teacher records
- Classes and subjects
- Assessments and grading foundation
- Attendance sessions
- Results and report cards
- Parent, Student, Teacher, School Admin, and Super Admin portal foundations
- Admin-controlled user creation foundation

## Tech stack

- Next.js
- React
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security

## Environment variables

Copy `.env.example` to `.env.local` for local development and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never commit `.env.local` or the Supabase service-role key.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Security model

Users do not choose their own role. Supabase authenticates the user, the backend reads the active role and school assignment, and the application automatically routes the user to the permitted portal. Row Level Security provides the database-level tenant and role boundary.

## Project status

This is an active MVP build. Core backend foundations are connected, while remaining production workflows and UI modules will continue to be refined before launch.
