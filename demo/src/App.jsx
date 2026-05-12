import { useState } from 'react';
import { questions } from './questions/index.js';
import QuestionView from './QuestionView.jsx';

export default function App() {
  const [activeId, setActiveId] = useState(questions[0].id);
  const q = questions.find((x) => x.id === activeId);

  return (
    <div className="app">
      <aside>
        <h1>Express Practice</h1>
        <ul>
          {questions.map((qq) => (
            <li key={qq.id}>
              <button
                className={qq.id === activeId ? 'active' : ''}
                onClick={() => setActiveId(qq.id)}
              >
                {qq.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main>
        <QuestionView key={q.id} q={q} />
      </main>
    </div>
  );
}
