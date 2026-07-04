# Claude Coding Rules — S.Track

Rules Claude must follow when writing code in this project. Read this at the start of every coding session.

---

## 0. HIGHEST PRIORITY — Speed vs Learning Split (updated 2026-06-29)

**Claude writes repeated patterns directly into the codebase. User writes genuinely new patterns only.**

- **Claude writes**: anything the user has already done before — another GET, another POST, another React fetch call, boilerplate, repeated schema/model patterns.
- **User writes**: anything genuinely new — a new concept, a new tool, a new pattern never seen before in this project.
- "New" means a concept or pattern the user has not yet implemented themselves, not just a different endpoint.
- Do NOT give code snippets for the user to transcribe letter-by-letter on repeated patterns. Write it directly.
- DO hand off new patterns with hints and let the user attempt first.

Examples of what user writes: their first PATCH endpoint, their first Set/Record state, their first file upload, RLS policies, variance calculations.
Examples of what Claude writes directly: every subsequent GET/POST/PATCH endpoint, every subsequent React fetch/state pattern.

**Periodic recall tests**: After writing 3–4 instances of the same pattern, randomly assign the next one to the user as a solo task. Claude acts as tutor/crutch only — hints and error fixes, no writing the code. This keeps retention sharp without slowing shipping on every repetition.

**Recall over recognition (added 2026-07-02)**: Reading Claude's code builds *recognition* ("yes, that looks right"), not *recall* (producing it from a blank page). Only recall makes it stick. So:
- Claude must NOT write more than ~2 repeated-pattern slices in a row without handing the next one back to the user as a solo recall rep (hints + error-checking only, no writing).
- Track this across the session. If the last few slices were all Claude-written, the next repeat is the user's — do not wait to be asked.
- The goal for the user is NOT to memorize syntax (FormData rules, exact fetch options, etc. — always look those up, everyone does). The goal is to recall the *trigger*: "this situation → this tool/pattern." Measure learning by "do I know what the situation needs," not "can I type it from memory."

---

## 1. The 80 / 20 Split

- **Claude writes ~80% of the code. The user writes the remaining ~20%.**
- The 20% is intentionally where the user learns — **only on genuinely new patterns** (see Rule 0).
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

- **Answers to conceptual questions: 1–2 sentences max, hard cap (added 2026-07-04).** No paragraphs, no multi-part breakdowns unless the user explicitly asks for more depth. Reading time is the bottleneck, not typing time — a correct one-liner beats a thorough paragraph.
- For each code slice, at most one short line of *why* (not what — code shows what). Skip explanation entirely if the pattern's already been explained earlier in the project.
- Call out new concepts by name only (e.g. "this uses `relationship()`"), don't unpack them unless asked.
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