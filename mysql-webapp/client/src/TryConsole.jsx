import { useState } from 'react';
import { api } from './api.js';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const HAS_BODY = new Set(['POST', 'PUT', 'PATCH']);

export default function TryConsole({ questionId, getCode, getEjsCode }) {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/');
  const [body, setBody] = useState('');
  const [headersText, setHeadersText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState(null);

  async function send() {
    setPending(true);
    setResponse(null);
    try {
      const headers = parseHeaders(headersText);
      const spec = { method, path, headers };
      if (HAS_BODY.has(method) && body.trim()) {
        spec.body = tryParseJson(body);
      }
      const res = await api.request(questionId, getCode(), getEjsCode(), spec);
      setResponse(res);
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="try">
      <div className="try-form">
        <div className="row">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="method"
          >
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            className="path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/hello?name=Ada"
            onKeyDown={(e) => {
              if (e.key === 'Enter') send();
            }}
          />
          <button className="primary" onClick={send} disabled={pending}>
            {pending ? 'Sending…' : 'Send'}
          </button>
        </div>

        <button
          className="link-btn"
          onClick={() => setShowAdvanced((s) => !s)}
        >
          {showAdvanced ? '▾ hide' : '▸ show'} headers / body
        </button>

        {showAdvanced && (
          <div className="advanced">
            <label>
              <span>Headers (one per line, <code>Name: value</code>)</span>
              <textarea
                rows={3}
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
                placeholder={'Content-Type: application/json\nAccept: text/plain'}
              />
            </label>
            <label>
              <span>
                Body{' '}
                {HAS_BODY.has(method) ? (
                  <em>(JSON or raw text)</em>
                ) : (
                  <em style={{ color: 'var(--muted)' }}>
                    (ignored for {method})
                  </em>
                )}
              </span>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={'{\n  "name": "Ada"\n}'}
                disabled={!HAS_BODY.has(method)}
              />
            </label>
          </div>
        )}
      </div>

      <ResponseView response={response} pending={pending} />
    </div>
  );
}

function parseHeaders(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(':');
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function statusClass(status) {
  if (status >= 500) return 'fail';
  if (status >= 400) return 'fail';
  if (status >= 300) return 'warn';
  return 'pass';
}

function ResponseView({ response, pending }) {
  if (pending) {
    return (
      <div className="try-response">
        <div className="resp-header">
          <span className="badge run">sending</span>
        </div>
      </div>
    );
  }
  if (!response) {
    return (
      <div className="try-response">
        <div className="resp-header">
          <span style={{ color: '#9aa3b8' }}>
            No response yet. Pick a method, type a path, hit{' '}
            <strong style={{ color: '#d4d8e3' }}>Send</strong>.
          </span>
        </div>
      </div>
    );
  }
  if (response.error) {
    return (
      <div className="try-response">
        <div className="resp-header">
          <span className="badge fail">{response.where || 'error'}</span>
          <span>{response.error}</span>
        </div>
        {response.stderr && (
          <pre className="resp-pane">{String(response.stderr)}</pre>
        )}
      </div>
    );
  }
  const { status, headers, body, elapsedMs } = response;
  const cls = statusClass(status);
  const headerLines = headers
    ? Object.entries(headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    : '';
  return (
    <div className="try-response">
      <div className="resp-header">
        <span className={`badge ${cls}`}>{status}</span>
        <span>{elapsedMs} ms</span>
        <span className="ct-hint">{headers?.['content-type'] || ''}</span>
      </div>
      <BodyView body={body || ''} contentType={headers?.['content-type']} />
      <details>
        <summary>Headers</summary>
        <pre className="resp-pane">{headerLines}</pre>
      </details>
    </div>
  );
}

function BodyView({ body, contentType }) {
  const isHtml = /\btext\/html\b/i.test(contentType || '');
  const isJson = /\bapplication\/json\b/i.test(contentType || '');
  const initial = isHtml ? 'rendered' : isJson ? 'pretty' : 'raw';
  const [mode, setMode] = useState(initial);

  const modes = [];
  if (isHtml) modes.push('rendered');
  if (isJson || tryParse(body) != null) modes.push('pretty');
  modes.push('raw');

  return (
    <div className="body-view">
      <div className="body-toolbar">
        <span className="body-label">Body</span>
        <span className="spacer" />
        <div className="seg">
          {modes.map((m) => (
            <button
              key={m}
              className={mode === m ? 'on' : ''}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {mode === 'rendered' && isHtml ? (
        <iframe
          className="rendered-frame"
          title="response body"
          sandbox=""
          srcDoc={body}
        />
      ) : mode === 'pretty' ? (
        <pre className="resp-pane">{prettyJson(body)}</pre>
      ) : (
        <pre className="resp-pane">{body || <em>(empty)</em>}</pre>
      )}
    </div>
  );
}

function tryParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function prettyJson(s) {
  const v = tryParse(s);
  if (v == null) return s || '';
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return s;
  }
}
