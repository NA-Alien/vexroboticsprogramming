begin;

create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 2 and 36 and char_length(author_name) <= 36),
  guide_slug text check (guide_slug ~ '^[a-z0-9-]{1,64}$'),
  title text not null check (char_length(btrim(title)) between 8 and 120 and char_length(title) <= 120),
  body text not null check (char_length(btrim(body)) >= 10 and char_length(body) <= 3000),
  code text not null default '' check (char_length(code) <= 5000),
  created_at timestamptz not null default now(),
  locked boolean not null default false,
  hidden boolean not null default false,
  solution_id uuid
);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads on delete cascade,
  author_id uuid not null default auth.uid() references auth.users on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 2 and 36 and char_length(author_name) <= 36),
  body text not null check (char_length(btrim(body)) >= 10 and char_length(body) <= 3000),
  code text not null default '' check (char_length(code) <= 5000),
  created_at timestamptz not null default now(),
  hidden boolean not null default false,
  unique (thread_id, id)
);

alter table public.forum_threads add constraint forum_solution_in_thread
  foreign key (id, solution_id) references public.forum_replies (thread_id, id)
  on delete set null (solution_id);

create index forum_threads_recent on public.forum_threads (created_at desc, id desc);
create index forum_threads_topic_recent on public.forum_threads (guide_slug, created_at desc, id desc);
create index forum_replies_thread_order on public.forum_replies (thread_id, created_at, id);
create index forum_threads_author on public.forum_threads (author_id);
create index forum_replies_author on public.forum_replies (author_id);

alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
revoke all on public.forum_threads, public.forum_replies from public, anon, authenticated;
grant select on public.forum_threads, public.forum_replies to anon, authenticated;
grant insert (author_name, guide_slug, title, body, code) on public.forum_threads to authenticated;
grant insert (thread_id, author_name, body, code) on public.forum_replies to authenticated;
grant update (solution_id, locked, hidden) on public.forum_threads to authenticated;
grant update (hidden) on public.forum_replies to authenticated;

create policy "Read visible threads" on public.forum_threads for select to anon, authenticated
  using (not hidden or (select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true');
create policy "Read visible replies" on public.forum_replies for select to anon, authenticated
  using (
    (not hidden or (select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true')
    and exists (select 1 from public.forum_threads where id = thread_id)
  );
create policy "Members create threads" on public.forum_threads for insert to authenticated
  with check (author_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy "Members reply to open threads" on public.forum_replies for insert to authenticated
  with check (
    author_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true'
    and exists (select 1 from public.forum_threads where id = thread_id and not locked and not hidden)
  );
create policy "Owners and moderators update threads" on public.forum_threads for update to authenticated
  using ((author_id = (select auth.uid()) and not hidden) or (select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true')
  with check ((author_id = (select auth.uid()) and not hidden) or (select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true');
create policy "Moderators manage replies" on public.forum_replies for update to authenticated
  using ((select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true')
  with check ((select auth.jwt()->'app_metadata'->>'forum_moderator') = 'true');

create schema if not exists forum_private;
revoke all on schema forum_private from public;

create function forum_private.check_thread_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    if (old.locked is distinct from new.locked or old.hidden is distinct from new.hidden)
      and (auth.jwt()->'app_metadata'->>'forum_moderator') is distinct from 'true' then
      raise insufficient_privilege using message = 'Only moderators can lock or hide discussions';
    end if;
    if old.solution_id is distinct from new.solution_id and new.solution_id is not null then
      if old.author_id is distinct from auth.uid() then
        raise insufficient_privilege using message = 'Only the thread author can accept a reply';
      end if;
      if not exists (
        select 1 from public.forum_replies where thread_id = old.id and id = new.solution_id and not hidden
      ) then
        raise check_violation using message = 'The solution must be a visible reply to this thread';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger forum_check_thread_update before update on public.forum_threads
  for each row execute function forum_private.check_thread_update();

create function forum_private.clear_hidden_solution() returns trigger
language plpgsql set search_path = '' as $$
begin
  update public.forum_threads set solution_id = null
  where id = new.thread_id and solution_id = new.id;
  return new;
end;
$$;

create trigger forum_clear_hidden_solution after update of hidden on public.forum_replies
  for each row when (new.hidden and not old.hidden) execute function forum_private.clear_hidden_solution();

revoke all on function forum_private.check_thread_update(), forum_private.clear_hidden_solution() from public;
commit;
