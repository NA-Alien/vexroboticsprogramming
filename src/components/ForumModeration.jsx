import { useEffect, useState } from 'react';

const reasons = {
  abuse: 'Abuse or profanity',
  spam: 'Spam',
  privacy: 'Private information',
  'off-topic': 'Off-topic',
  other: 'Other',
};

export function ReportButton({ client, threadId, replyId }) {
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [reported, setReported] = useState(false);

  async function report(event) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    try {
      const reason = new FormData(event.currentTarget).get('reason');
      const { error } = await client.from('forum_reports').insert({
        thread_id: threadId, reply_id: replyId ?? null, reason,
      });
      if (error && error.code !== '23505') throw error;
      setReported(true);
      setExpanded(false);
      setMessage(error ? 'You already flagged this item.' : 'Flag sent to the moderators.');
    } catch {
      setMessage('Could not send the flag. Try again.');
    } finally {
      setPending(false);
    }
  }

  return <div className="forum-report">
    {!reported && <button type="button" className="forum-link-button" aria-expanded={expanded}
      disabled={pending} onClick={() => setExpanded(value => !value)}>{replyId ? 'Flag reply' : 'Flag discussion'}</button>}
    {expanded && <form onSubmit={report}>
      <label>Reason<select name="reason" defaultValue="" required>
        <option value="" disabled>Select a reason</option>
        {Object.entries(reasons).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select></label>
      <button className="button-primary" disabled={pending}>{pending ? 'Sending…' : 'Send flag'}</button>
    </form>}
    {message && <p className="forum-byline" role="status">{message}</p>}
  </div>;
}

export function ModerationQueue({ client }) {
  const [reports, setReports] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data, error: queryError } = await client.from('forum_reports')
          .select('id, thread_id, reply_id, reason, thread:forum_threads!forum_reports_thread_id_fkey(title, hidden), reply:forum_replies!forum_report_reply_in_thread(body, hidden)')
          .eq('resolved', false).order('created_at').order('id').limit(50).abortSignal(controller.signal);
        if (queryError) throw queryError;
        if (!controller.signal.aborted) setReports(data);
      } catch {
        if (!controller.signal.aborted) setError('Could not load flagged posts. Refresh the page to try again.');
      }
    }
    load();
    return () => controller.abort();
  }, [client]);

  async function review(item, remove) {
    setPending(true);
    setError('');
    try {
      if (remove) {
        const table = item.reply_id ? 'forum_replies' : 'forum_threads';
        const { error: removeError } = await client.from(table).update({ hidden: true })
          .eq('id', item.reply_id ?? item.thread_id).select('id').single();
        if (removeError) throw removeError;
        setReports(current => current.map(report => {
          if (item.reply_id && report.reply_id === item.reply_id) return { ...report, reply: { ...report.reply, hidden: true } };
          if (!item.reply_id && report.thread_id === item.thread_id) return { ...report, thread: { ...report.thread, hidden: true } };
          return report;
        }));
      }
      const { error: resolveError } = await client.from('forum_reports').update({ resolved: true })
        .eq('id', item.id).select('id').single();
      if (resolveError) throw resolveError;
      setReports(current => current.filter(report => report.id !== item.id));
    } catch {
      setError('Could not finish reviewing this flag. Refresh to check its current status.');
    } finally {
      setPending(false);
    }
  }

  return <>
    <a href="/forum/">← Back to discussions</a>
    <h2>Flagged posts</h2>
    {error && <p role="alert">{error}</p>}
    {!reports && !error && <p role="status">Loading flags…</p>}
    {reports?.length === 0 && <p>No unreviewed flags in this batch. Refresh for new flags.</p>}
    {reports?.map(item => <article className="forum-card" key={item.id}>
      <p className="forum-tag">{item.reply_id ? 'Reply' : 'Discussion'} · {reasons[item.reason]}</p>
      <h3><a href={`/forum/?thread=${item.thread_id}`}>{item.thread?.title ?? 'View discussion'}</a></h3>
      {item.reply?.body && <p className="forum-summary">{item.reply.body}</p>}
      <div className="forum-actions">
        {!(item.reply?.hidden || item.thread?.hidden) && <button type="button" disabled={pending}
          onClick={() => review(item, true)}>Remove and resolve</button>}
        <button type="button" disabled={pending} onClick={() => review(item, false)}>Resolve flag</button>
      </div>
    </article>)}
  </>;
}
