import { useEffect, useState } from 'react';
import { api } from './api.js';
import QuestionView from './QuestionView.jsx';

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .list()
      .then((list) => {
        setQuestions(list);
        if (list.length) setActiveId(list[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="app">
      <aside>
        <h1>Express Practice</h1>
        {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
        <ul>
          {questions.map((q) => (
            <li key={q.id}>
              <button
                className={q.id === activeId ? 'active' : ''}
                onClick={() => setActiveId(q.id)}
              >
                {q.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main>
        {activeId ? (
          <QuestionView key={activeId} id={activeId} />
        ) : (
          <div className="loading">Loading…</div>
        )}
      </main>
    </div>
  );
}
