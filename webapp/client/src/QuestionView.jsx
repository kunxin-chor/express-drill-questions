import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Editor from '@monaco-editor/react';
import { api } from './api.js';
import { storage } from './storage.js';
import TryConsole from './TryConsole.jsx';

const TABS = ['problem', 'try', 'solution', 'walkthrough'];
const PANEL_KEY = 'expr-practice:panelOpen';

export default function QuestionView({ id, onResult }) {
  const [tab, setTab] = useState('problem');
  const [data, setData] = useState(null);
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(() => {
    try {
      return localStorage.getItem(PANEL_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const saveTimer = useRef(null);

  function togglePanel() {
    setPanelOpen((open) => {
      const next = !open;
      try {
        localStorage.setItem(PANEL_KEY, String(next));
      } catch {}
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setResult(null);
    setRevealed(false);
    setTab('problem');
    api.get(id).then((d) => {
      if (cancelled) return;
      setData(d);
      const saved = storage.loadCode(id);
      setCode(saved != null ? saved : d.starter);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function onCodeChange(value) {
    const next = value ?? '';
    setCode(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      storage.saveCode(id, next);
    }, 250);
  }

  async function runTests() {
    clearTimeout(saveTimer.current);
    storage.saveCode(id, code);
    setRunning(true);
    setResult({ status: 'running' });
    try {
      const r = await api.run(id, code);
      setResult({ status: 'done', ...r });
      onResult?.(!!r.passed);
    } catch (err) {
      setResult({ status: 'error', error: err.message });
    } finally {
      setRunning(false);
    }
  }

  function resetCode() {
    if (!confirm('Discard your changes and restore the starter code?')) return;
    storage.clearCode(id);
    setCode(data.starter);
    setResult(null);
  }

  if (!data) return <div className="loading">Loading…</div>;

  return (
    <div className={`workspace ${panelOpen ? '' : 'panel-collapsed'}`}>
      <section className="code-pane">
        <div className="code-toolbar">
          <span className="filename">{id}/app.js</span>
          <span className="spacer" style={{ flex: 1 }} />
          <button onClick={resetCode}>Reset to starter</button>
          <button className="primary" onClick={runTests} disabled={running}>
            {running ? 'Running…' : 'Run tests'}
          </button>
          <button
            className="toggle-panel"
            onClick={togglePanel}
            title={panelOpen ? 'Expand editor (hide panel)' : 'Restore panel'}
          >
            {panelOpen ? '⟩⟩' : '⟨⟨'}
          </button>
        </div>
        <div className="editor-wrap">
          <Editor
            height="100%"
            language="javascript"
            value={code}
            onChange={onCodeChange}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              tabSize: 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
        <TestOutput result={result} />
      </section>

      {panelOpen && (
        <section className="info-pane">
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={tab === t ? 'active' : ''}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>

          {tab === 'problem' && (
            <div className="panel">
              <div className="md">
                <h1>{data.title}</h1>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.prompt}</ReactMarkdown>
              </div>
            </div>
          )}

          {tab === 'try' && (
            <div className="panel try-panel">
              <TryConsole questionId={id} getCode={() => code} />
            </div>
          )}

          {tab === 'solution' && (
            <div className="panel">
              {data.solution ? (
                revealed ? (
                  <pre className="solution-pre">{data.solution}</pre>
                ) : (
                  <div className="reveal-box">
                    <p>
                      Try solving the problem first. Click below to reveal a
                      reference solution.
                    </p>
                    <button onClick={() => setRevealed(true)}>Reveal solution</button>
                  </div>
                )
              ) : (
                <div className="md">
                  <p>No reference solution for this question.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'walkthrough' && (
            <div className="panel">
              <div className="md">
                {data.walkthrough ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.walkthrough}</ReactMarkdown>
                ) : (
                  <p>No walkthrough yet for this question.</p>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function TestOutput({ result }) {
  if (!result) {
    return (
      <div className="test-output">
        <div className="out-header">
          <span style={{ color: '#9aa3b8' }}>
            Click <strong style={{ color: '#d4d8e3' }}>Run tests</strong> to
            execute Jest against your code.
          </span>
        </div>
      </div>
    );
  }
  if (result.status === 'running') {
    return (
      <div className="test-output">
        <div className="out-header">
          <span className="badge run">running</span>
          <span>Spawning Jest…</span>
        </div>
      </div>
    );
  }
  if (result.status === 'error') {
    return (
      <div className="test-output">
        <div className="out-header">
          <span className="badge fail">error</span>
          <span>{result.error}</span>
        </div>
      </div>
    );
  }
  const { passed, exitCode, timedOut, durationMs, stdout, stderr } = result;
  return (
    <div className="test-output">
      <div className="out-header">
        <span className={`badge ${passed ? 'pass' : 'fail'}`}>
          {passed ? 'PASS' : timedOut ? 'TIMEOUT' : 'FAIL'}
        </span>
        <span>exit {exitCode}</span>
        <span>{durationMs} ms</span>
      </div>
      <pre>{(stderr || '') + (stdout || '')}</pre>
    </div>
  );
}
