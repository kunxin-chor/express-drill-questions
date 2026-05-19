# Express Practice — Requirements

## Distribution

- Students **fork the repo** and run it themselves (Codespaces, local, any
  Node host).
- A central hosted instance may also be offered, but it must be **safe to
  share**: no per-student server state.

## Persistence

- Student edits live in the browser's `localStorage`, keyed by question id
  (`expr-practice:code:<id>`).
- The server is **stateless** w.r.t. student code: it never writes student
  code to permanent storage and never serves a student-specific copy.
- "Reset to starter" = clear the localStorage entry and re-render the
  read-only starter.

## Question authoring — single Markdown per question

- Each question is a **single `.md` file** under
  `questions/<category-slug>/<NN-slug>.md`.
- The folder is the **category**. An optional `_category.md` in the folder
  provides a category title + intro; otherwise the title is derived from the
  folder name.
- The file name (without `NN-` prefix and `.md` extension) becomes the
  question **id and title** (slug → "Title Case"). E.g.
  `01-hello-world.md` → id `hello-world`, title "Hello world".
- The `NN-` prefix controls **order** within the category. Same for
  categories (folders may also be prefixed `NN-`).
- **No YAML frontmatter.** Everything is in H1 sections.

### Recognized H1 sections (order in file does not matter)

| Section       | Content                                                           |
| ------------- | ----------------------------------------------------------------- |
| `# Problem`     | Markdown shown on the Problem tab.                                |
| `# Starter`     | Exactly one fenced ```js block. Its content is the starter file.  |
| `# Solution`    | Exactly one fenced ```js block. Reference solution.              |
| `# Tests`       | Exactly one fenced ```js block. Becomes `app.test.js` at run time.|
| `# Walkthrough` | Markdown shown on the Walkthrough tab.                            |

`Problem`, `Starter`, `Tests` are **required**. `Solution` and `Walkthrough`
are optional.

## Build pipeline

- `tools/build-questions.js` walks `questions/**/*.md`, parses each file,
  emits a single **`questions.generated.json`** in the repo root
  (gitignored).
- Output shape:

  ```json
  {
    "categories": [
      {
        "slug": "basics",
        "title": "Basics",
        "intro": "...optional markdown...",
        "questions": [
          {
            "id": "hello-world",
            "categorySlug": "basics",
            "title": "Hello world",
            "order": 1,
            "prompt": "...",
            "starter": "...",
            "solution": "...",
            "testCode": "...",
            "walkthrough": "..."
          }
        ]
      }
    ]
  }
  ```

- Scripts:
  - `npm run build:questions` — one-shot regen.
  - `npm run dev` — runs the question build once, starts a watcher
    (`questions/**/*.md`) that re-emits on save, plus the server and Vite.
  - `npm run build` — `build:questions` then Vite build.

## Server (stateless)

- `GET /api/questions` → `{ categories: [{ slug, title, questions: [{id,title}] }] }`
  (lightweight tree for the sidebar).
- `GET /api/questions/:id` → full question payload.
- `POST /api/questions/:id/run` body `{code}` → ephemeral test runner:
  1. Mkdtemp under `webapp/.runs/`.
  2. Write `app.js` (student code) + `app.test.js` (from generated JSON).
  3. Spawn `jest --runTestsByPath .runs/.../app.test.js`. Capture stdout +
     stderr with byte cap. 15 s wall-clock kill.
  4. Delete the temp dir.
  5. Respond `{passed, exitCode, timedOut, truncated, durationMs, stdout, stderr}`.
- Serves the built client (single-port) when `client/dist/index.html`
  exists.

## Client UX

- Sidebar lists categories (collapsible) → questions.
- Per question: tabs **Problem · Code · Solution · Walkthrough**.
- Code tab: Monaco editor for `app.js`, **Run tests** button, output panel
  with Jest stdout, **Reset to starter** button.
- Implicit autosave to localStorage on edit (debounced).
- Solution tab is gated behind a Reveal button.

## Try tab — interactive request console

A fifth tab between **Code** and **Solution** lets the student fire ad-hoc
HTTP requests at their own app:

- Method dropdown + path field, optional headers and body.
- `POST /api/questions/:id/request` body `{code, method, path, headers,
  body}` — server writes `app.js` to a temp dir and spawns
  `tools/request-runner.js`, which uses `supertest` to fire one request
  in-process, then emits the response as JSON. Same lifecycle as the test
  runner: temp dir, 15s timeout, cleanup.
- Response panel offers three view modes:
  - **Rendered** — `srcDoc` iframe with `sandbox=""` (no scripts, no
    same-origin). Default for `text/html`.
  - **Pretty** — JSON-parsed and indented. Default for
    `application/json`.
  - **Raw** — verbatim text body.

## Roadmap — multi-file questions (EJS, etc.) — **deferred**

To support questions that exercise template engines (`res.render`, EJS,
Pug…) and middleware split across files, the question format will be
extended:

- A question's MD file may declare additional files via fenced blocks with
  a path attribute, e.g.

  ````md
  # Starter

  ```js
  // app.js
  const express = require('express');
  ...
  ```

  ```ejs path="views/index.ejs"
  <h1>Hello, <%= name %></h1>
  ```
  ````

  The build tool collects all fenced blocks under `# Starter` (and
  `# Solution`) into a `{ "app.js": "...", "views/index.ejs": "..." }` map.
- Client editor grows file tabs (Monaco multi-model).
- `request-runner.js` and the test runner materialize **every** file in
  the temp dir before requiring `./app`.
- localStorage persistence becomes per-(question, file).
- Extra runtime deps (`ejs`, `pug`, etc.) are added once at the webapp
  root and resolved via Node's normal upward `node_modules` lookup.

This lands when the first templating question is authored — not before.

## Non-goals (initial)

- Auth, accounts, identity.
- Server-side progress tracking, analytics.
- Hidden tests / grading separation.
- Multi-file student code (see roadmap above).

## Initial content

`questions/01-basics/`:

1. `01-hello-world.md` — `GET /` → `hello world`.
2. `02-hello-route-param.md` — `GET /hello/:name` → `Hello, <name>!`.
3. `03-hello-query-string.md` — `GET /hello?name=<name>` → `Hello, <name>!`
   (default `stranger`).
