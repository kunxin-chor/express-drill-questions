import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackTests,
} from '@codesandbox/sandpack-react';

const TABS = ['problem', 'code', 'solution', 'walkthrough'];

export default function QuestionView({ q }) {
  const [tab, setTab] = useState('problem');
  const [revealed, setRevealed] = useState(false);

  return (
    <SandpackProvider
      template="node"
      theme="light"
      files={q.files}
      options={{
        visibleFiles: ['/app.js', '/app.test.js'],
        activeFile: '/app.js',
      }}
    >
     <div className="qv">
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
            <ReactMarkdown>{q.prompt}</ReactMarkdown>
          </div>
        </div>
      )}

      {tab === 'code' && (
        <div className="sp-host">
          <SandpackLayout>
            <SandpackCodeEditor showTabs showLineNumbers closableTabs={false} />
            <SandpackTests />
          </SandpackLayout>
        </div>
      )}

      {tab === 'solution' && (
        <div className="panel">
          {revealed ? (
            <pre className="solution-pre">{q.solution}</pre>
          ) : (
            <div className="reveal-box">
              <p>
                Try solving the problem first. Click below to reveal a reference
                solution.
              </p>
              <button onClick={() => setRevealed(true)}>Reveal solution</button>
            </div>
          )}
        </div>
      )}

      {tab === 'walkthrough' && (
        <div className="panel">
          <div className="md">
            <ReactMarkdown>{q.walkthrough}</ReactMarkdown>
          </div>
        </div>
      )}
     </div>
    </SandpackProvider>
  );
}
