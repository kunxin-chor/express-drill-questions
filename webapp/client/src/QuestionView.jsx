import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';
import { api } from './api.js';

const TABS = ['problem', 'code', 'solution', 'walkthrough'];

export default function QuestionView({ id }) {
  const [tab, setTab] = useState('problem');
  const [data, setData] = useState(null);
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setResult(null);
    setRevealed(false);
    api.get(id).then((d) => {
      if (cancelled) return;
      setData(d);
      setCode(d.appCode);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function onCodeChange(value) {
    const next = value ?? '';
    setCode(next);
    // Debounced autosave.
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      api.save(id, next).finally(() => setSaving(false));
    }, 500);
  }

  async function runTests() {
    clearTimeout(saveTimer.current);
    setRunning(true);
    setResult({ status: 'running' });
    try {
      const r = await api.run(id, code);
      setResult({ status: 'done', ...r });
    } catch (err) {
      setResult({ status: 'error', error: err.message });
    } finally {
      setRunning(false);
    }
  }

  async function resetCode() {
    if (!confirm('Discard your changes and restore the starter code?')) return;
    const { appCode } = await api.reset(id);
    setCode(appCode);
    setResult(null);
  }

  if (!data) return <div className="loading">Loading…</div>;

  return (
    <>
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
            <ReactMarkdown>{data.prompt}</ReactMarkdown>
          </div>
        </div>
      )}

      {tab === 'code' && (
        <div className="code-view">
          <div className="code-toolbar">
            <span className="filename">questions/{id}/app.js</span>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>
              {saving ? 'saving…' : 'saved'}
            </span>
            <span className="spacer" />
            <button onClick={resetCode}>Reset to starter</button>
            <button
              className="primary"
              onClick={runTests}
              disabled={running}
            >
              {running ? 'Running…' : 'Run tests'}
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
        </div>
      )}

      {tab === 'solution' && (
        <div className="panel">
          {revealed ? (
            <pre className="solution-pre">{data.solution}</pre>
          ) : (
            <div className="reveal-box">
              <p>
                Try solving the problem first. Click below to reveal a
                reference solution.
              </p>
              <button onClick={() => setRevealed(true)}>Reveal solution</button>
            </div>
          )}
        </div>
      )}

      {tab === 'walkthrough' && (
        <div className="panel">
          <div className="md">
            <ReactMarkdown>{data.walkthrough}</ReactMarkdown>
          </div>
        </div>
      )}
    </>
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
  const { passed, exitCode, durationMs, stdout, stderr } = result;
  return (
    <div className="test-output">
      <div className="out-header">
        <span className={`badge ${passed ? 'pass' : 'fail'}`}>
          {passed ? 'PASS' : 'FAIL'}
        </span>
        <span>exit {exitCode}</span>
        <span>{durationMs} ms</span>
      </div>
      <pre>{(stderr || '') + (stdout || '')}</pre>
    </div>
  );
}
