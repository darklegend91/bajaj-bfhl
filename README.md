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
