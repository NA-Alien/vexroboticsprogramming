begin;

create table forum_private.post_cooldowns (
  author_id uuid primary key references auth.users on delete cascade,
  posted_at timestamptz not null
);
alter table forum_private.post_cooldowns enable row level security;
revoke all on forum_private.post_cooldowns from public, anon, authenticated;

create function forum_private.check_new_post() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  submitted_at timestamptz := clock_timestamp();
  content text := concat_ws(E'\n', new.author_name, to_jsonb(new)->>'title', new.body, new.code);
begin
  if new.author_id is distinct from auth.uid() or auth.uid() is null then
    raise insufficient_privilege using message = 'A signed-in forum author is required';
  end if;

  if content ~* '[a-z0-9_.%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
    or content ~ '-----BEGIN [A-Z ]*PRIVATE KEY-----'
    or content ~ '(sk-proj-|sb_secret_|ghp_|github_pat_)[A-Za-z0-9_-]{12,}' then
    raise exception using errcode = '23514', message = 'forum_private_information';
  end if;

  insert into forum_private.post_cooldowns (author_id, posted_at)
  values (new.author_id, submitted_at)
  on conflict (author_id) do update set posted_at = excluded.posted_at
  where forum_private.post_cooldowns.posted_at <= excluded.posted_at - interval '8 seconds';

  if not found then
    raise exception using errcode = 'P0001', message = 'forum_post_cooldown';
  end if;
  return new;
end;
$$;

revoke all on function forum_private.check_new_post() from public, anon, authenticated;
create trigger forum_check_new_thread before insert on public.forum_threads
  for each row execute function forum_private.check_new_post();
create trigger forum_check_new_reply before insert on public.forum_replies
  for each row execute function forum_private.check_new_post();
commit;
