async function j(res) {
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${txt}`);
  }
  return res.json();
}

export const api = {
  list: () => fetch('/api/questions').then(j),
  get: (id) => fetch(`/api/questions/${id}`).then(j),
  save: (id, code) =>
    fetch(`/api/questions/${id}/app`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).then(j),
  run: (id, code) =>
    fetch(`/api/questions/${id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).then(j),
  reset: (id) =>
    fetch(`/api/questions/${id}/reset`, { method: 'POST' }).then(j),
};
