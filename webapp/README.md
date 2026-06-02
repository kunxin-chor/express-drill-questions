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

## Deploy to Render

A [`render.yaml`](./render.yaml) blueprint is included.

**Option A — Blueprint (recommended).**

1. Push this repo to GitHub.
2. In the Render dashboard: **New +** → **Blueprint**, pick the repo.
3. Render reads `webapp/render.yaml` and provisions a Web Service.

**Option B — Manual web service.**

In the Render dashboard, **New +** → **Web Service**, then:

| Field | Value |
| --- | --- |
| Root Directory | `webapp` |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `node server.js` |
| Environment | Node |
| Node version | 20 (set `NODE_VERSION=20`) |
| Env var | `NPM_CONFIG_PRODUCTION=false` |

### Why those settings

- **`--include=dev`** + **`NPM_CONFIG_PRODUCTION=false`** — Render sets
  `NODE_ENV=production` by default, which makes npm skip devDependencies.
  The client uses `vite` (devDep) for its production build, so dev deps
  must be installed during the build phase.
- **Start command is `node server.js`**, not `npm start`. The build
  already ran `build:questions`, so there's no need to regenerate
  `questions.generated.json` at boot. (Free-tier dynos sleep when idle;
  fewer boot steps = faster cold starts.)
- **`PORT` is read from env automatically** (see `server.js`), so no port
  configuration is needed.

### Things to know

- Free tier sleeps after ~15 minutes of inactivity; first request after
  sleep takes ~30 s. Fine for a question bank, painful for live class
  demos — bump to a paid plan if that matters.
- Each test/try run spawns a child Node process. Free tier has 512 MB and
  0.1 CPU, which handles the 3 starter questions but will struggle if you
  add heavy questions or many concurrent students. Move to **Starter**
  plan for shared classroom use.
- The `.runs/` temp dir is on the container's ephemeral disk — perfect,
  since runs are short-lived and we delete them after each request.
- Persistence is **localStorage in the student's browser**, so a single
  hosted instance is safe to share across students.

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
