import { useEffect, useRef, useState } from 'react';
import { guides } from '../content/guides.js';
import { exampleThreads } from '../content/forumExamples.js';
import { ModerationQueue, ReportButton } from './ForumModeration.jsx';
import './ForumPage.css';

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const welcomeTitle = 'Welcome to the VEX Programming Forum!';

export function ForumWelcome() {
  return <div className="home-content forum-page">
    <header className="catalog-heading forum-heading">
      <a className="forum-back" href="/forum/">← Back to discussions</a>
      <h1>{welcomeTitle}</h1>
      <p>Whether you’re writing your first autonomous routine or tuning a robot for competition, you’re welcome here. Ask questions, share what worked, and help other teams learn.</p>
    </header>
    <section className="forum-card forum-welcome" aria-labelledby="forum-rules">
      <h2 id="forum-rules">Forum rules</h2>
      <ol>
        <li>Be respectful. Explain your suggestions and give beginners room to learn.</li>
        <li>Keep posts VEX-related.</li>
        <li>Give enough context to help. Include your setup, what you expected, and what you already tried.</li>
        <li>Keep personal information private. Leave out contact details, passwords, and API keys.</li>
        <li>Skip spam and duplicate posts. Credit other people’s code and mark the answer that solved your question.</li>
      </ol>
    </section>
  </div>;
}

function forumLink(query) {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
  return params.size ? `/forum/?${params}` : '/forum/';
}

function postError(error) {
  if (error?.message === 'forum_profanity') {
    return 'Remove profanity from the post or reply before publishing.';
  }
  if (error?.message === 'forum_private_information') {
    return 'Remove email addresses and private credentials before posting.';
  }
  if (error?.message === 'forum_post_cooldown') {
    return 'Please wait a few seconds before posting again.';
  }
  return 'Could not publish. Check your fields and whether the discussion is still open.';
}

function PostContent({ post }) {
  return <>
    <p className="forum-byline">{post.author_name}</p>
    <p className="forum-body">{post.body}</p>
    {post.code && <pre className="forum-code"><code>{post.code}</code></pre>}
  </>;
}

export default function ForumPage() {
  const [locationState, setLocationState] = useState(null);
  const [backend, setBackend] = useState(null);
  const [session, setSession] = useState(null);
  const [discussion, setDiscussion] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [revision, setRevision] = useState(0);
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const codeInput = useRef(null);
  const emailInput = useRef(null);
  const client = backend?.forumClient;
  const { guideSlug, threadId, page = 0, status, reports } = locationState ?? {};
  const guide = guides.find(item => item.slug === guideSlug);
  const activeTopic = guide?.slug;
  const user = session?.user;
  const moderator = user?.app_metadata?.forum_moderator === true;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedPage = Number(params.get('page'));
    const requestedStatus = params.get('status');
    setLocationState({
      guideSlug: params.get('guide'), threadId: params.get('thread'),
      reports: params.get('moderation') === '1',
      status: ['solved', 'unsolved'].includes(requestedStatus) ? requestedStatus : null,
      page: Number.isInteger(requestedPage) && requestedPage >= 0 ? Math.min(requestedPage, 10_000) : 0,
    });
    let active = true;
    let subscription;
    import('../lib/forum-client.js').then(module => {
      if (!active) return;
      setBackend(module);
      if (module.forumClient) {
        subscription = module.forumClient.auth.onAuthStateChange((_event, current) => {
          setSession(current);
        }).data.subscription;
      }
    }).catch(() => {
      if (active) setError('The forum could not start. Refresh the page to try again.');
    });
    return () => { active = false; subscription?.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!client || !locationState || reports) return;
    if (threadId && !uuid.test(threadId)) {
      setDiscussion({ thread: null });
      return;
    }
    let active = true;
    backend.loadDiscussion(client, { threadId, guideSlug: activeTopic, page, status })
      .then(data => { if (active) setDiscussion(data); })
      .catch(() => { if (active) setError('Could not load discussions. Refresh the page to retry.'); });
    return () => { active = false; };
  }, [backend, client, locationState, threadId, activeTopic, page, status, reports, revision, user?.id, moderator]);

  useEffect(() => {
    if (codeSent) codeInput.current?.focus();
  }, [codeSent]);

  async function run(action, failure, setFailure = setError) {
    setSending(true);
    setFailure('');
    setNotice('');
    try {
      await action();
    } catch (error) {
      setFailure(typeof failure === 'function' ? failure(error) : failure);
    } finally {
      setSending(false);
    }
  }

  function sendCode(event) {
    event.preventDefault();
    const address = new FormData(event.currentTarget).get('email').trim();
    requestCode(address);
  }

  function requestCode(address) {
    setAuthNotice('');
    run(async () => {
      const { error: authError } = await client.auth.signInWithOtp({ email: address });
      if (authError) throw authError;
      setEmail(address);
      setAuthNotice(codeSent ? 'A new code was sent.' : '');
      setCodeSent(true);
      if (codeSent) codeInput.current?.focus();
    }, 'Could not send a code. Check your email address or try again in a minute.', setAuthError);
  }

  function verifyCode(event) {
    event.preventDefault();
    const token = new FormData(event.currentTarget).get('token').trim();
    run(async () => {
      const { error: authError } = await client.auth.verifyOtp({ email, token, type: 'email' });
      if (authError) throw authError;
      setEmail('');
      setCodeSent(false);
      setAuthNotice('');
    }, 'That code did not work. Check it or request a new one.', setAuthError);
  }

  function submitPost(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const post = {
      author_name: fields.get('name').trim(), body: fields.get('body').trim(), code: fields.get('code').trim(),
    };
    run(async () => {
      if (threadId) {
        const { error: writeError } = await client.from('forum_replies').insert({ ...post, thread_id: threadId });
        if (writeError) throw writeError;
        form.reset();
        setNotice('Reply posted.');
        setRevision(value => value + 1);
      } else {
        const { data, error: writeError } = await client.from('forum_threads')
          .insert({ ...post, title: fields.get('title').trim(), guide_slug: fields.get('topic') || null })
          .select('id').single();
        if (writeError) throw writeError;
        window.location.assign(forumLink({ thread: data.id }));
      }
    }, postError);
  }

  function updatePost(table, id, changes) {
    run(async () => {
      const { error: writeError } = await client.from(table).update(changes).eq('id', id).select('id').single();
      if (writeError) throw writeError;
      setRevision(value => value + 1);
    }, 'Could not update this discussion. Refresh the page and try again.');
  }

  function deletePost(table, id) {
    const discussion = table === 'forum_threads';
    const message = discussion ? 'Permanently delete this discussion and all of its replies?' : 'Permanently delete this reply?';
    if (!window.confirm(message)) return;
    run(async () => {
      const { error: deleteError } = await client.from(table).delete().eq('id', id).select('id').single();
      if (deleteError) throw deleteError;
      if (discussion) window.location.assign('/forum/');
      else setRevision(value => value + 1);
    }, 'Could not delete this item. Refresh the page and try again.');
  }

  const preview = backend && !backend.forumConfigured;
  const thread = preview ? exampleThreads.find(item => item.id === threadId) : discussion?.thread;
  const threads = preview ? exampleThreads.filter(item =>
    (!activeTopic || item.guide_slug === activeTopic) && (!status || Boolean(item.solution_id) === (status === 'solved'))
  ) : discussion?.threads;
  const replies = preview ? thread?.replies : discussion?.replies;
  const threadGuide = guides.find(item => item.slug === thread?.guide_slug);
  const showComposer = user && !reports && (!threadId || (thread && !thread.locked && !thread.hidden));
  const pagination = { guide: activeTopic, thread: threadId, status };

  return <div className="home-content forum-page">
    <header className="catalog-heading forum-heading">
      <h1>VEX Programming Forum</h1>
      <p>Make a post about any VEX programming question or share a comment with the community.</p>
      {client && !user && <button type="button" className="forum-sign-in-link" onClick={() => (codeSent ? codeInput : emailInput).current?.focus()}>Sign in to post ↓</button>}
    </header>
    {preview && <p className="forum-status" role="status">Preview with example discussions. Posting opens once the forum backend is connected.</p>}
    {error && <p className="forum-status" role="alert">{error}</p>}
    {notice && <p className="forum-status" role="status">{notice}</p>}
    {user && <div className="forum-account">
      {moderator && <a href="/forum/?moderation=1">Flagged posts</a>}
      <button type="button" className="forum-link-button" disabled={sending} onClick={() => run(async () => {
        const { error: authError } = await client.auth.signOut();
        if (authError) throw authError;
        setDiscussion(null);
        setRevision(value => value + 1);
      }, 'Could not sign out. Try again.')}>Sign out</button>
    </div>}
    <div className="catalog-layout forum-layout">
      <section aria-label="Discussions">
        {reports ? (moderator ? <ModerationQueue client={client}/> : <p>Sign in with a moderator account to view flags.</p>) : <>
        {!preview && !discussion && !error && <p role="status">Loading discussions…</p>}
        {threadId && (preview || discussion) && <>
          <a href={forumLink({ guide: threadGuide?.slug })}>← Back to discussions</a>
          {!thread ? <p>Discussion not found.</p> : <>
            <article className="forum-card forum-thread">
              {threadGuide && <a className="forum-tag" href={`/guides/${threadGuide.slug}/`}>{threadGuide.title} guide</a>}
              {thread.locked && <span className="forum-tag">Locked</span>}
              {thread.hidden && <span className="forum-tag">Hidden</span>}
              <h2>{thread.title}</h2>
              <PostContent post={thread}/>
              {moderator && <div className="forum-actions">
                <button type="button" disabled={sending} onClick={() => updatePost('forum_threads', thread.id, { locked: !thread.locked })}>{thread.locked ? 'Unlock' : 'Lock thread'}</button>
                <button type="button" disabled={sending} onClick={() => updatePost('forum_threads', thread.id, { hidden: !thread.hidden })}>{thread.hidden ? 'Restore discussion' : 'Remove from forum'}</button>
                {thread.hidden && <button type="button" disabled={sending} onClick={() => deletePost('forum_threads', thread.id)}>Delete permanently</button>}
              </div>}
              {user && !thread.hidden && <ReportButton key={user.id} client={client} threadId={thread.id}/>}
            </article>
            <h2>Replies</h2>
            {replies?.length === 0 && <p>No replies yet.</p>}
            {replies?.map(reply => <article className={thread.solution_id === reply.id ? 'forum-card forum-solution' : 'forum-card'} key={reply.id}>
              {thread.solution_id === reply.id && <span className="forum-tag">✓ Accepted answer</span>}
              {reply.hidden && <span className="forum-tag">Hidden</span>}
              <PostContent post={reply}/>
              <div className="forum-actions">
                {user?.id === thread.author_id && user && !reply.hidden &&
                  <button type="button" disabled={sending} onClick={() => updatePost('forum_threads', thread.id, { solution_id: thread.solution_id === reply.id ? null : reply.id })}>
                    {thread.solution_id === reply.id ? 'Remove solution' : 'Mark as solution'}
                  </button>}
                {moderator && <button type="button" disabled={sending} onClick={() => updatePost('forum_replies', reply.id, { hidden: !reply.hidden })}>{reply.hidden ? 'Restore reply' : 'Remove reply'}</button>}
                {moderator && reply.hidden && <button type="button" disabled={sending} onClick={() => deletePost('forum_replies', reply.id)}>Delete permanently</button>}
              </div>
              {user && !thread.hidden && !reply.hidden && <ReportButton key={user.id} client={client} threadId={thread.id} replyId={reply.id}/>}
            </article>)}
          </>}
        </>}
        {!threadId && <>
          <div className="forum-list-heading">
            <h2>{guide ? guide.title : 'Discussions'}</h2>
            <div className="forum-actions">
              <label>Filter by guide
                <select value={activeTopic ?? ''} onChange={event => window.location.assign(forumLink({ guide: event.target.value, status }))}>
                  <option value="">All topics</option>
                  {guides.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
                </select>
              </label>
              <label>Answer status
                <select value={status ?? ''} onChange={event => window.location.assign(forumLink({ guide: activeTopic, status: event.target.value }))}>
                  <option value="">All discussions</option>
                  <option value="unsolved">Unsolved</option>
                  <option value="solved">Solved</option>
                </select>
              </label>
            </div>
          </div>
          {!activeTopic && !status && page === 0 && <article className="forum-card">
            <p className="forum-tag">Pinned</p>
            <h3><a href="/forum/welcome/">{welcomeTitle}</a></h3>
            <p className="forum-summary">Read the forum rules before making your first post.</p>
          </article>}
          {threads?.length === 0 && <p className="forum-empty">No community discussions here yet.</p>}
          {threads?.map(item => <article className="forum-card" key={item.id}>
            <div className="forum-actions">
              <span className="forum-tag">{guides.find(topic => topic.slug === item.guide_slug)?.title ?? 'General'}</span>
              {item.solution_id && <span className="forum-tag forum-solved">✓ Solved</span>}
              {item.hidden && <span className="forum-tag">Hidden</span>}
              {item.locked && <span className="forum-tag">Locked</span>}
            </div>
            <h3><a href={forumLink({ thread: item.id })}>{item.title}</a></h3>
            <p className="forum-summary">{item.body}</p>
            <p className="forum-byline">{item.author_name}</p>
          </article>)}
        </>}
        {!preview && (page > 0 || discussion?.more) && <nav className="forum-actions" aria-label="Discussion pages">
          {page > 0 && <a href={forumLink({ ...pagination, page: page - 1 })}>← Previous</a>}
          {discussion?.more && <a href={forumLink({ ...pagination, page: page + 1 })}>Next →</a>}
        </nav>}
        </>}
      </section>
      <aside className="reference-tools forum-sidebar">
        {client && !user && <section className="forum-auth" aria-labelledby="forum-auth-title" aria-busy={sending}>
          <h2 id="forum-auth-title">{codeSent ? 'Check your inbox' : 'Sign in to the forum'}</h2>
          <p className="forum-auth-help">{codeSent ? <>Enter the code sent to <strong>{email}</strong>.</> : 'Use your email to post and reply. We’ll send you a one-time code.'}</p>
          {authError && <p className="forum-auth-feedback" role="alert">{authError}</p>}
          {authNotice && <p className="forum-auth-feedback" role="status">{authNotice}</p>}
          {codeSent ? <form key="code" onSubmit={verifyCode}>
            <label>Sign-in code<input ref={codeInput} className="forum-otp" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required/></label>
            <button className="button-primary" disabled={sending}>{sending ? 'Please wait…' : 'Verify and sign in'}</button>
            <div className="forum-auth-options">
              <button type="button" disabled={sending} onClick={() => requestCode(email)}>Resend code</button>
              <button type="button" disabled={sending} onClick={() => { setCodeSent(false); setAuthNotice(''); setAuthError(''); }}>Change email</button>
            </div>
          </form> : <form onSubmit={sendCode}>
            <label>Email address<input ref={emailInput} type="email" name="email" autoComplete="email" defaultValue={email} placeholder="you@example.com" required/></label>
            <button className="button-primary" disabled={sending}>{sending ? 'Sending code…' : 'Send sign-in code'}</button>
          </form>}
        </section>}
        {showComposer && <section className="forum-card">
          <h2>{threadId ? 'Write a reply' : 'Start a discussion'}</h2>
          <form onSubmit={submitPost}>
            {!threadId && <>
              <label>Topic<select name="topic" defaultValue={activeTopic ?? ''}>
                <option value="">General</option>
                {guides.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
              </select></label>
              <label>Title<input name="title" minLength={8} maxLength={120} required/></label>
            </>}
            <label>Display name<input name="name" minLength={2} maxLength={36} required/></label>
            <label>{threadId ? 'Reply' : 'What happened?'}<textarea name="body" rows={5} minLength={10} maxLength={3000} required/></label>
            <label>C++ snippet (optional)<textarea className="forum-code-input" name="code" rows={4} maxLength={5000} spellCheck={false}/></label>
            <button className="button-primary" disabled={sending}>{threadId ? 'Post reply' : 'Post discussion'}</button>
          </form>
        </section>}
        <section className="forum-card forum-tips">
          <h2>Get a better answer</h2>
          <ul>
            <li>Describe your drivetrain, sensors, and programming environment.</li>
            <li>Share the expected behavior, the actual behavior, and one test you ran.</li>
            <li>Use a display name and keep contact details out of public posts.</li>
          </ul>
        </section>
      </aside>
    </div>
  </div>;
}
