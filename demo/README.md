# Express Practice — PoC

Interactive Express question bank running entirely in the browser via
[Sandpack](https://sandpack.codesandbox.io/) + Nodebox.

## Run

```bash
cd demo
npm install
npm run dev
```

Open http://localhost:5173.

## How it works

- Each question lives in `src/questions/<id>/` as plain files
  (`prompt.md`, `walkthrough.md`, `starter.js`, `solution.js`, `app.test.js`).
- Vite `?raw` imports load those files as strings.
- `SandpackProvider` with the `node` template boots a Node.js runtime in the
  browser. `SandpackCodeEditor` lets the student edit `app.js`. `SandpackTests`
  discovers `*.test.js` and shows pass/fail.
- Tests use `supertest` against the exported Express `app` — no ports involved.

## Add a new question

1. Copy `src/questions/01-hello/` to `src/questions/NN-slug/`.
2. Edit the five files.
3. Register it in `src/questions/index.js`.
