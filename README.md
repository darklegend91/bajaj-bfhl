# BFHL — Hierarchy Resolver

Round 1 submission for the **Chitkara Full Stack Engineering Challenge**.
A Node.js / Express REST API (`POST /bfhl`) that parses edge strings, builds
hierarchical trees, detects cycles, and returns structured insights — plus a
single-page frontend.

## Stack
- **Backend:** Node.js + Express, CORS enabled
- **Frontend:** Vanilla HTML/CSS/JS (served as a static page by the same server)
- **No database, no build step.**

## API

### `POST /bfhl`
Request:
```json
{ "data": ["A->B", "A->C", "B->D"] }
```
Returns `user_id`, `email_id`, `college_roll_number`, `hierarchies`,
`invalid_entries`, `duplicate_edges`, and `summary`.

### `GET /bfhl`
Health check.

## Run locally
```bash
npm install
npm start          # http://localhost:3000  (frontend + API)
npm test           # runs the spec example through the processor
```

## ⚠️ Before submitting — set your real credentials
Edit the `IDENTITY` object near the top of **`server.js`**:
```js
const IDENTITY = {
  user_id: "fullname_ddmmyyyy",   // e.g. adityapathania_21092004
  email_id: "your.email@chitkara.edu.in",
  college_roll_number: "YOUR_ROLL",
};
```

## Deploy (Render — recommended, free)
1. Push this folder to a **public GitHub repo**.
2. On [render.com](https://render.com): **New → Web Service** → connect the repo.
3. Build command: `npm install` · Start command: `npm start`.
4. Render sets `PORT` automatically (the server reads `process.env.PORT`).
5. Your API base url is the Render URL; the evaluator calls `<url>/bfhl`.
6. The frontend is served at the **same** url root `/`.

`render.yaml` is included for one-click blueprint deploys.

### Deploy on Vercel / Railway / Netlify
Any Node host works. Ensure the start command is `node server.js` and that the
platform's injected `PORT` is used (already handled).

## Implemented rules
- Validation `^[A-Z]->[A-Z]$`, whitespace trimmed, self-loops invalid.
- Duplicate edges recorded once (first occurrence builds the tree).
- Multiple independent trees; root = node never seen as a child.
- Diamond / multi-parent: **first-encountered parent wins**, others discarded.
- Cycles: `has_cycle: true`, `tree: {}`, no `depth`; pure cycles use the
  lexicographically smallest node as root.
- Depth = node count on the longest root-to-leaf path.
- `largest_tree_root` ties broken by lexicographically smaller root.

Verified against the spec's worked example (output matches exactly).
