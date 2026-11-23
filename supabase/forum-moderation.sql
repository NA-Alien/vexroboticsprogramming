begin;

create function forum_private.contains_profanity(content text) returns boolean
language sql immutable strict set search_path = '' as $$
  select content ~* '\y(fuck(s|ed|er|ers|ing)?|motherfuck(er|ers|ing)?|bullshit|shit(s|ty|ting)?|bitch(es|y)?|asshole(s)?|dickhead(s)?|cunt(s)?)\y';
$$;

create function forum_private.check_forum_language() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if forum_private.contains_profanity(
    concat_ws(E'\n', new.author_name, to_jsonb(new)->>'title', new.body, new.code)
  ) then
    raise exception using errcode = '23514', message = 'forum_profanity';
  end if;
  return new;
end;
$$;

revoke all on function forum_private.contains_profanity(text), forum_private.check_forum_language()
  from public, anon, authenticated;
create trigger forum_check_language_thread before insert on public.forum_threads
  for each row execute function forum_private.check_forum_language();
create trigger forum_check_language_reply before insert on public.forum_replies
  for each row execute function forum_private.check_forum_language();

create table public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads on delete cascade,
  reply_id uuid,
  reporter_id uuid not null default auth.uid() references auth.users on delete cascade,
  reason text not null check (reason in ('abuse', 'spam', 'privacy', 'off-topic', 'other')),
  created_at timestamptz not null default now(),
  resolved boolean not null default false,
  constraint forum_report_reply_in_thread foreign key (thread_id, reply_id)
    references public.forum_replies (thread_id, id) on delete cascade,
  unique nulls not distinct (reporter_id, thread_id, reply_id)
);

create index forum_reports_queue on public.forum_reports (created_at, id) where not resolved;
create index forum_reports_target on public.forum_reports (thread_id, reply_id);
alter table public.forum_reports enable row level security;
revoke all on public.forum_reports from public, anon, authenticated;
grant select (id, thread_id, reply_id, reason, created_at, resolved) on public.forum_reports to authenticated;
grant insert (thread_id, reply_id, reason) on public.forum_reports to authenticated;
grant update (resolved) on public.forum_reports to authenticated;

create policy "Members flag public posts" on public.forum_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (select auth.jwt()->>'is_anonymous') is distinct from 'true'
    and exists (select 1 from public.forum_threads t where t.id = forum_reports.thread_id and not t.hidden)
    and (reply_id is null or exists (
      select 1 from public.forum_replies r
      where r.id = forum_reports.reply_id and r.thread_id = forum_reports.thread_id and not r.hidden
    ))
  );
create policy "Moderators read reports" on public.forum_reports for select to authenticated
  using ((select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true');
create policy "Moderators resolve reports" on public.forum_reports for update to authenticated
  using ((select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true')
  with check ((select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true');

grant delete on public.forum_threads, public.forum_replies to authenticated;
create policy "Moderators delete removed threads" on public.forum_threads for delete to authenticated
  using (hidden and (select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true');
create policy "Moderators delete removed replies" on public.forum_replies for delete to authenticated
  using (hidden and (select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true');

update public.forum_threads set hidden = true
where not hidden and forum_private.contains_profanity(concat_ws(E'\n', author_name, title, body, code));
update public.forum_replies set hidden = true
where not hidden and forum_private.contains_profanity(concat_ws(E'\n', author_name, body, code));
commit;
