import { useEffect, useId, useRef, useState } from 'react';

function highlight(code) {
  // Tokenize as text. React escapes all content; never interpret code as HTML.
  return code.split(/(\/\/[^\n]*|"[^"\n]*"|\b(?:bool|double|int|void|return|if|while|const|constexpr|struct|using|namespace|true|false|include)\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g).map((token, i) => {
    const kind = token.startsWith('//') ? 'comment' : token.startsWith('"') ? 'string' : /^\d/.test(token) ? 'number' : /^(bool|double|int|void|return|if|while|const|constexpr|struct|using|namespace|true|false|include)$/.test(token) ? 'keyword' : '';
    return kind ? <span key={i} className={`syntax-${kind}`}>{token}</span> : token;
  });
}

export default function CodeBlock({ code, label = 'VEXcode C++' }) {
  const [message, setMessage] = useState('');
  const [wrapped, setWrapped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const codeId = useId();
  const lineCount = code.split('\n').length;
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    clearTimeout(timer.current);
    try { await navigator.clipboard.writeText(code); setMessage('Copied'); }
    catch { setMessage('Copy failed. Select the code to copy it.'); }
    timer.current = setTimeout(() => setMessage(''), 3500);
  }
  return <div className="code-block">
    <div className="code-toolbar"><span>{label}</span><div className="code-actions"><button className="code-wrap" onClick={() => setWrapped(value => !value)} aria-pressed={wrapped} aria-label={`Wrap lines: ${label}`}>{wrapped ? 'Unwrap' : 'Wrap lines'}</button><button onClick={copy} aria-label={`Copy code: ${label}`}>{message === 'Copied' ? 'Copied' : 'Copy code'}</button></div></div>
    <pre id={codeId} className={[wrapped && 'code-wrapped', expanded && 'code-expanded'].filter(Boolean).join(' ')} tabIndex="0" aria-label={label}><code>{highlight(code)}</code></pre>
    {lineCount > 24 && <button className="code-expand" aria-expanded={expanded} aria-controls={codeId} onClick={() => setExpanded(value => !value)}>{expanded ? 'Collapse example' : `Show full example (${lineCount} lines)`}</button>}
    <span className={message && message !== 'Copied' ? 'copy-error' : 'sr-only'} role="status">{message}</span>
  </div>;
}
