# Express Practice

Interactive question bank for learning Express. Students edit `app.js` in a
browser-based Monaco editor and click **Run tests** to execute Jest +
`supertest` against their code on the server.

The server is **stateless** w.r.t. student code: edits live only in the
browser's `localStorage`. See [`requirements.md`](./requirements.md) for the
design contract.

## Quick start

```bash
npm install      # installs server + client deps
npm run build    # builds the client into client/dist
npm start        # serves API + client on http://localhost:5174
```

For live editing of the UI:

```bash
npm run dev      # server on 5174, Vite on 5173 (proxies /api)
```

## Codespaces

1. Fork → open in a Codespace.
2. `npm install && npm run build && npm start`.
3. The Ports panel auto-forwards 5174. Open the forwarded URL.

## Layout

```
webapp/
  server.js               stateless Express API + static client
  questions/
    01-hello-world/
      prompt.md
      walkthrough.md
      starter.js
      solution.js
      app.test.js
    02-hello-route-param/
    03-hello-query-string/
  client/                 Vite + React + Monaco
  .runs/                  ephemeral test workspaces (gitignored)
```

## Add a question

Copy any `questions/NN-slug/` folder, edit the five files. It appears in the
sidebar on next page load. No registry to edit.
