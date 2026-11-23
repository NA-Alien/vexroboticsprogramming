import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const forumConfigured = Boolean(
  /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url ?? '') && key?.startsWith('sb_publishable_')
);

export const forumClient = forumConfigured && typeof window !== 'undefined'
  ? createClient(url, key, { auth: { detectSessionInUrl: false } })
  : null;

export async function loadDiscussion(client, { threadId, guideSlug, page, status }) {
  const threads = client.from('forum_threads')
    .select('id, guide_slug, title, body, code, author_name, author_id, created_at, locked, hidden, solution_id');
  if (threadId) {
    const [thread, replies] = await Promise.all([
      threads.eq('id', threadId).maybeSingle(),
      client.from('forum_replies').select('id, author_name, body, code, hidden')
        .eq('thread_id', threadId).order('created_at').order('id').range(page * 30, page * 30 + 30),
    ]);
    if (thread.error || replies.error) throw thread.error || replies.error;
    return { thread: thread.data, replies: replies.data.slice(0, 30), more: replies.data.length > 30 };
  }

  if (guideSlug) threads.eq('guide_slug', guideSlug);
  if (status === 'solved') threads.not('solution_id', 'is', null);
  if (status === 'unsolved') threads.is('solution_id', null);
  const { data, error } = await threads.order('created_at', { ascending: false })
    .order('id', { ascending: false }).range(page * 20, page * 20 + 20);
  if (error) throw error;
  return { threads: data.slice(0, 20), more: data.length > 20 };
}
