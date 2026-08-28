-- E-School launch hardening: access and academic integrity constraints.
-- This migration is intentionally defensive and only adds constraints/indexes
-- when the required tables/columns exist.

do $$
begin
  if to_regclass('public.user_school_roles') is not null then
    create unique index if not exists uq_user_school_role_active
      on public.user_school_roles(user_id, school_id, role)
      where is_active = true;
  end if;

  if to_regclass('public.student_guardians') is not null then
    create unique index if not exists uq_student_guardian_relationship
      on public.student_guardians(school_id, student_id, guardian_id);
  end if;

  if to_regclass('public.student_enrollments') is not null then
    create unique index if not exists uq_student_active_enrollment_year
      on public.student_enrollments(school_id, student_id, academic_year_id)
      where enrollment_status = 'active';
  end if;

  if to_regclass('public.student_scores') is not null then
    create unique index if not exists uq_student_assessment_score
      on public.student_scores(school_id, assessment_id, student_id);
  end if;

  if to_regclass('public.report_cards') is not null then
    create unique index if not exists uq_student_term_report_card
      on public.report_cards(school_id, student_id, academic_year_id, term_id, class_id);
  end if;

  if to_regclass('public.attendance_sessions') is not null then
    create unique index if not exists uq_class_attendance_session
      on public.attendance_sessions(school_id, academic_year_id, term_id, class_id, attendance_date);
  end if;

  if to_regclass('public.attendance_records') is not null then
    create unique index if not exists uq_attendance_student_session
      on public.attendance_records(attendance_session_id, student_id);
  end if;
end $$;

-- Protect role assignments from accidental duplicate active grants. These
-- database constraints complement server-side role checks and tenant filters.
comment on index public.uq_user_school_role_active is
  'Prevents duplicate active role grants for the same user, school and role.';
