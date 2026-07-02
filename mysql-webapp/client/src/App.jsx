import { useEffect, useState } from 'react';
import { api } from './api.js';
import QuestionView from './QuestionView.jsx';

export default function App() {
  const [tree, setTree] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [solved, setSolved] = useState(() => readSolved());
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .list()
      .then((data) => {
        setTree(data);
        const first = data.categories?.[0]?.questions?.[0]?.id;
        // Read the question ID from URL hash, or default to first question
        const hashId = window.location.hash.slice(1);
        setActiveId(hashId || first);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Update URL hash when activeId changes
  useEffect(() => {
    if (activeId) {
      window.location.hash = activeId;
    }
  }, [activeId]);

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hashId = window.location.hash.slice(1);
      if (hashId && hashId !== activeId) {
        setActiveId(hashId);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeId]);

  function markSolved(id, passed) {
    setSolved((prev) => {
      const next = { ...prev };
      if (passed) next[id] = true;
      // Don't unset on failure — we only track "ever passed".
      writeSolved(next);
      return next;
    });
  }

  return (
    <div className="app">
      <aside>
        <h1>SQL Practice</h1>
        {error && <div className="err">{error}</div>}
        {tree?.categories.map((cat) => (
          <div className="cat" key={cat.slug}>
            <div className="cat-title">{cat.title}</div>
            <ul>
              {cat.questions.map((q) => (
                <li key={q.id}>
                  <button
                    className={[
                      q.id === activeId ? 'active' : '',
                      solved[q.id] ? 'solved' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setActiveId(q.id)}
                  >
                    <span>{q.title}</span>
                    <span className="spacer" style={{ flex: 1 }} />
                    <span className="status">
                      {solved[q.id] ? '✓' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      <main>
        {activeId ? (
          <QuestionView
            key={activeId}
            id={activeId}
            onResult={(passed) => markSolved(activeId, passed)}
          />
        ) : (
          <div className="loading">Loading…</div>
        )}
      </main>
    </div>
  );
}

function readSolved() {
  try {
    return JSON.parse(localStorage.getItem('expr-practice:solved') || '{}');
  } catch {
    return {};
  }
}
function writeSolved(obj) {
  try {
    localStorage.setItem('expr-practice:solved', JSON.stringify(obj));
  } catch {}
}
