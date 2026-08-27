-- E-School immutable audit security hardening.
-- Applied to production Supabase on 2026-08-27.

create table if not exists public.audit_ledger (
  chain_index bigint generated always as identity primary key,
  audit_log_id uuid not null unique references public.audit_logs(id),
  previous_hash text,
  event_hash text not null unique,
  recorded_at timestamptz not null default now()
);

alter table public.audit_ledger enable row level security;
drop policy if exists audit_ledger_super_admin_read on public.audit_ledger;
create policy audit_ledger_super_admin_read on public.audit_ledger for select to authenticated using (public.current_user_is_super_admin());

create or replace function public.prevent_audit_storage_mutation()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  raise exception 'Immutable audit storage cannot be modified or removed';
end;
$$;

drop trigger if exists audit_logs_no_truncate on public.audit_logs;
create trigger audit_logs_no_truncate before truncate on public.audit_logs for each statement execute function public.prevent_audit_storage_mutation();
drop trigger if exists audit_ledger_no_update_delete on public.audit_ledger;
create trigger audit_ledger_no_update_delete before update or delete on public.audit_ledger for each row execute function public.prevent_audit_storage_mutation();
drop trigger if exists audit_ledger_no_truncate on public.audit_ledger;
create trigger audit_ledger_no_truncate before truncate on public.audit_ledger for each statement execute function public.prevent_audit_storage_mutation();

revoke insert, update, delete, truncate on public.audit_ledger from anon, authenticated, service_role;
grant select on public.audit_ledger to authenticated, service_role;

create or replace function public.append_audit_ledger_entry()
returns trigger language plpgsql security definer set search_path=public,extensions as $$
declare prev text; payload text; digest_value text;
begin
  perform pg_advisory_xact_lock(hashtext('e_school_audit_chain_v1'));
  select event_hash into prev from public.audit_ledger order by chain_index desc limit 1;
  payload := concat_ws('|',coalesce(prev,'GENESIS'),new.id::text,coalesce(new.school_id::text,''),coalesce(new.user_id::text,''),coalesce(new.action,''),coalesce(new.entity_type,''),coalesce(new.entity_id::text,''),coalesce(new.old_values::text,''),coalesce(new.new_values::text,''),coalesce(new.reason,''),new.created_at::text);
  digest_value := encode(digest(payload,'sha256'),'hex');
  insert into public.audit_ledger(audit_log_id,previous_hash,event_hash) values(new.id,prev,digest_value);
  return new;
end;
$$;

drop trigger if exists audit_logs_append_hash_chain on public.audit_logs;
create trigger audit_logs_append_hash_chain after insert on public.audit_logs for each row execute function public.append_audit_ledger_entry();

create or replace function public.capture_auth_user_change()
returns trigger language plpgsql security definer set search_path=public,auth as $$
declare target_id uuid; sid uuid; actor uuid; oldj jsonb; newj jsonb;
begin
  target_id := coalesce(new.id,old.id); actor := auth.uid();
  oldj := case when tg_op in ('UPDATE','DELETE') then jsonb_build_object('id',old.id,'email',old.email,'email_confirmed_at',old.email_confirmed_at,'last_sign_in_at',old.last_sign_in_at,'updated_at',old.updated_at) else null end;
  newj := case when tg_op in ('INSERT','UPDATE') then jsonb_build_object('id',new.id,'email',new.email,'email_confirmed_at',new.email_confirmed_at,'last_sign_in_at',new.last_sign_in_at,'updated_at',new.updated_at) else null end;
  select school_id into sid from public.user_school_roles where user_id=target_id and is_active=true order by created_at desc limit 1;
  insert into public.audit_logs(school_id,user_id,action,entity_type,entity_id,old_values,new_values,reason) values(sid,actor,lower('auth_user_'||tg_op),'authentication_user',target_id,oldj,newj,'Automatically recorded authentication account lifecycle change');
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists e_school_auth_user_audit on auth.users;
create trigger e_school_auth_user_audit after insert or update or delete on auth.users for each row execute function public.capture_auth_user_change();

create or replace function public.capture_auth_audit_entry()
returns trigger language plpgsql security definer set search_path=public,auth as $$
declare action_name text; actor_id uuid;
begin
  action_name := coalesce(new.payload->>'action',new.payload->>'type','authentication_event');
  begin actor_id := nullif(new.payload->>'actor_id','')::uuid; exception when others then actor_id := null; end;
  insert into public.audit_logs(user_id,action,entity_type,entity_id,new_values,reason) values(actor_id,'auth_'||lower(action_name),'authentication_event',new.id,jsonb_build_object('payload',new.payload,'ip_address',new.ip_address),'Automatically captured Supabase authentication audit event');
  return new;
end;
$$;

drop trigger if exists e_school_auth_audit_entries on auth.audit_log_entries;
create trigger e_school_auth_audit_entries after insert on auth.audit_log_entries for each row execute function public.capture_auth_audit_entry();

create or replace function public.verify_audit_ledger()
returns table(is_valid boolean, audit_rows bigint, ledger_rows bigint, first_bad_index bigint)
language plpgsql security definer set search_path=public,extensions as $$
declare rec record; expected_prev text := null; expected_hash text; bad bigint := null; a_count bigint; l_count bigint;
begin
  select count(*) into a_count from public.audit_logs; select count(*) into l_count from public.audit_ledger;
  for rec in select l.chain_index,l.previous_hash,l.event_hash,a.* from public.audit_ledger l join public.audit_logs a on a.id=l.audit_log_id order by l.chain_index loop
    expected_hash := encode(digest(concat_ws('|',coalesce(expected_prev,'GENESIS'),rec.id::text,coalesce(rec.school_id::text,''),coalesce(rec.user_id::text,''),coalesce(rec.action,''),coalesce(rec.entity_type,''),coalesce(rec.entity_id::text,''),coalesce(rec.old_values::text,''),coalesce(rec.new_values::text,''),coalesce(rec.reason,''),rec.created_at::text),'sha256'),'hex');
    if rec.previous_hash is distinct from expected_prev or rec.event_hash<>expected_hash then bad:=rec.chain_index; exit; end if;
    expected_prev:=rec.event_hash;
  end loop;
  return query select (bad is null and a_count=l_count),a_count,l_count,bad;
end;
$$;
revoke all on function public.verify_audit_ledger() from public;
grant execute on function public.verify_audit_ledger() to authenticated,service_role;

create or replace function public.block_audit_object_drop()
returns event_trigger language plpgsql security definer set search_path=public as $$
declare obj record;
begin
  for obj in select * from pg_event_trigger_dropped_objects() loop
    if obj.schema_name='public' and obj.object_name in ('audit_logs','audit_ledger','capture_audit_change','prevent_audit_log_mutation','prevent_audit_storage_mutation','append_audit_ledger_entry','capture_auth_user_change','capture_auth_audit_entry','verify_audit_ledger') then
      raise exception 'Protected audit object % cannot be dropped',obj.object_identity;
    end if;
  end loop;
end;
$$;

drop event trigger if exists protect_audit_objects_from_drop;
create event trigger protect_audit_objects_from_drop on sql_drop execute function public.block_audit_object_drop();

create or replace function public.block_audit_table_ddl()
returns event_trigger language plpgsql security definer set search_path=public as $$
declare cmd record;
begin
  for cmd in select * from pg_event_trigger_ddl_commands() loop
    if cmd.object_identity in ('public.audit_logs','public.audit_ledger') and cmd.command_tag in ('ALTER TABLE','ALTER TABLE ATTACH PARTITION','ALTER TABLE DETACH PARTITION') then
      raise exception 'Protected audit table % cannot be altered',cmd.object_identity;
    end if;
  end loop;
end;
$$;

drop event trigger if exists protect_audit_tables_from_alter;
create event trigger protect_audit_tables_from_alter on ddl_command_end execute function public.block_audit_table_ddl();

revoke update,delete,truncate on public.audit_logs from anon,authenticated,service_role;
revoke update,delete,truncate on public.audit_ledger from anon,authenticated,service_role;
