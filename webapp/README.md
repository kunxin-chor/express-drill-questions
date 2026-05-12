# Express Practice — Web UI

Interactive Express question bank. Students edit `app.js` in a browser-based
Monaco editor, click **Run tests**, and see Jest output. The Express app under
test runs in-process via `supertest` — no listening server, no port management.

## Run

There are two modes. Pick one.

### Dev mode (live reload, two ports)

Best when authoring questions or hacking on the UI.

```bash
cd webapp
npm install                 # also installs client deps via postinstall
npm run dev                 # server on 5174, Vite client on 5173
```

Open http://localhost:5173.

### Single-port mode (recommended for Codespaces / hosting)

The server serves the built client *and* the API on one port. Students only
need one forwarded URL.

```bash
cd webapp
npm install                 # also installs client deps
npm run build               # builds client into client/dist
npm start                   # serves everything on 5174
```

Open http://localhost:5174.

### Codespaces

1. Open the repo in a Codespace.
2. Run the single-port commands above.
3. Make port **5174** public from the Ports panel and share the URL.

No client-side code changes needed — the client fetches `/api/...` from its
own origin, which is the same Express server.

## Layout

```
webapp/
  server.js                 # Express API
  package.json              # server + jest + supertest
  questions/
    01-hello/
      prompt.md
      walkthrough.md
      starter.js            # initial code (read-only reference)
      solution.js           # reference solution
      app.test.js           # supertest assertions
      app.js                # student's working copy (auto-created, gitignored)
    02-greet-query/
      ...
  client/                   # Vite + React + Monaco
```

## API

- `GET  /api/questions`            list of `{id,title}`
- `GET  /api/questions/:id`        full content (prompt, walkthrough, solution, app code, test code)
- `PUT  /api/questions/:id/app`    save edited `app.js` (`{code}`)
- `POST /api/questions/:id/run`    spawn `jest` for that question; returns stdout/stderr/exitCode
- `POST /api/questions/:id/reset`  copy starter over current `app.js`

## Add a new question

Copy any `questions/NN-slug/` folder, edit the five files, and it appears in
the sidebar automatically (questions are auto-discovered).
