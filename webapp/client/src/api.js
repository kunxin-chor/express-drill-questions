const SESSION_KEY = 'expr-practice:session';

function getSessionId() {
  let id;
  try {
    id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
  } catch {
    id = 'anonymous';
  }
  return id;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-Session-Id': getSessionId(),
  };
}

async function j(res) {
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    let detail = txt;
    try {
      const parsed = JSON.parse(txt);
      if (parsed?.error) detail = parsed.error;
    } catch {}
    throw new Error(
      res.status === 429
        ? `Rate limit: ${detail}`
        : `${res.status} ${res.statusText}: ${detail}`,
    );
  }
  return res.json();
}

export const api = {
  list: () => fetch('/api/questions').then(j),
  get: (id) => fetch(`/api/questions/${id}`).then(j),
  run: (id, code) =>
    fetch(`/api/questions/${id}/run`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ code }),
    }).then(j),
  request: (id, code, spec) =>
    fetch(`/api/questions/${id}/request`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ code, ...spec }),
    }).then(j),
};
