# Claude Coding Rules — S.Track

Rules Claude must follow when writing code in this project. Read this at the start of every coding session.

---

## 1. The 80 / 20 Split

- **Claude writes ~80% of the code. The user writes the remaining ~20%.**
- The 20% is intentionally where the user learns. Claude must leave clear, marked gaps for the user to complete.
- When stopping for the user's 20%, mark it explicitly:
  ```ts
  // TODO(user): implement the validation check here
  // hint: compare requested_qty vs approved_qty, flag if >10%
  ```
- Do NOT silently fill in the user's portion. If unsure where to stop, ask.

## 2. Vertical Slices, Not Feature Dumps

- Never implement an entire feature in one go.
- **500 lines is too much. Aim for ~50 lines per step.**
- A "step" = one thin vertical slice the user can run, read, and understand before moving on.
- Example for "submit material request" feature, broken into steps:
  1. DB migration for `material_requests` table only (~30 lines).
  2. SQLAlchemy model + Pydantic schema (~40 lines).
  3. One FastAPI POST endpoint, no validation yet (~30 lines).
  4. Add validation + error handling (~40 lines).
  5. Minimal Next.js form posting to it (~50 lines).
  6. Wire up auth + company_id scoping (~40 lines).

  Each step ships, runs, and is reviewed before the next begins.

## 3. Stop and Wait Cadence

- After each ~50-line slice: **stop, summarize what was added, and wait for the user**.
- Do not chain slices without confirmation.
- If the user says "continue" without other instructions, proceed to the next planned slice — don't skip ahead.

## 4. Explain as You Go

- For each slice, include a 2–4 line plain-language explanation of *what* and *why*.
- Call out any new concept (e.g. "this uses SQLAlchemy's `relationship()` — it's how we tell the ORM that a request has many items").
- Prefer linking to / quoting the relevant doc in `node_modules/next/dist/docs/` (Next 16) or SQLAlchemy/FastAPI docs over inventing explanations.

## 5. Respect the Stack & Constraints

- Next.js **16.2.3** — APIs/conventions may differ from training data. Verify against `node_modules/next/dist/docs/` per `AGENTS.md`.
- Backend is **Python FastAPI + SQLAlchemy**, not Node.
- DB is **PostgreSQL via Supabase**. Storage is **Supabase Storage**.
- All money columns: `numeric(14,2)`. All timestamps: `timestamptz`, server-default.
- Multi-tenant: every query filters by `company_id`. No exceptions.
- Audit rules from spec: append-only event tables, soft delete only, server-stamped timestamps, photo hash on server.

## 6. Don't Over-Engineer

- No abstractions before there are 3 concrete uses.
- No premature config files, base classes, or wrapper utilities.
- No error handling for cases that can't happen (trust internal calls; validate only at boundaries).
- No comments that restate the code. Only comment when *why* is non-obvious.

## 7. Ask Before Risky / Wide-Reaching Changes

- Schema changes after the schema is locked → confirm first.
- Renames across many files → confirm first.
- Anything that touches auth, billing, or audit-log integrity → confirm first.
- Destructive Git or DB ops (drop, force-push, migration rollback) → confirm first.

## 8. Learning Hand-Off

- When a slice introduces a new concept the user hasn't met, suggest a single line for `learned.md` so the user can capture it.
- Don't write to `learned.md` directly — that's the user's file.

## 9. Session Close-Out

At the end of a coding session, Claude updates:
- `Project-Context.md` → new session entry (what changed, decisions, where to resume).
- `README.md` task list → mark done / add follow-ups.

Claude does NOT update `learned.md` (user-owned).
`