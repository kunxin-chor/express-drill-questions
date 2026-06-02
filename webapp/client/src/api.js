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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).then(j),
  request: (id, code, spec) =>
    fetch(`/api/questions/${id}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, ...spec }),
    }).then(j),
};
