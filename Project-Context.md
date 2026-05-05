# Project Context — S.Track

> Rolling log of session-level context. Each session appends a new entry under **Session History** so the next session can pick up without re-deriving state. Keep entries short and factual — code itself is the source of truth.

**Read order at session start:**
1. This file (`Project-Context.md`) — where we left off.
2. `Project-Spec.md` — what we're building.
3. `claude-rule.md` — how to write code on this project.
4. `README.md` → task list — what's next.

---

## Project Snapshot

- **Repo**: `S.Track` (GitHub: `Palatipdev/S.Track`)
- **Product**: Construction materials procurement visibility dashboard. Replaces Excel + WhatsApp. Multi-tenant SaaS.
- **Frontend**: Next.js `16.2.3` (App Router), React `19.2.4`, Tailwind v4, TypeScript 5.
- **Backend**: Python **FastAPI** + SQLAlchemy (separate service, not Next API routes).
- **Database / Storage / Auth**: **Supabase** (Postgres + Storage + Auth, RLS by `company_id`).
- **Important**: Next.js 16 has breaking changes vs. older versions — consult `node_modules/next/dist/docs/` per `AGENTS.md` before writing Next code.
- **Working directory**: `C:\Users\riaza\Documents\s-track`
- **Platform**: Windows 11, PowerShell.

## Locked Decisions (do not relitigate without reason)

- **Multi-tenancy**: many companies, one app. Every table has `company_id`.
- **Backend**: Python FastAPI (user knows it well, industry-standard for the role).
- **Frontend version**: Next.js 16 (not 14 — overrides earlier spec draft).
- **Auth/DB/Storage provider**: Supabase.
- **Variance scope (MVP)**: requested vs ordered only. Used-vs-delivered deferred to v2.
- **Approver**: Owner only. Buyer logs PO post-approval. Both onsite and office engineer can submit requests. Factory + onsite confirm delivery.
- **Notifications**: post-MVP. Low reward / high commitment for now.
- **PK strategy**: `BIGINT` auto-increment. Add `public_id uuid` later only if needed.
- **Audit integrity (non-negotiable)**: append-only event tables, soft delete only, server-stamped timestamps, photo `sha256` hashed on server.

## Current State

- Boilerplate `create-next-app` scaffold only (`app/page.tsx`, `app/layout.tsx`).
- No backend project initialized yet (FastAPI not scaffolded).
- No DB schema applied. Supabase project not yet created.
- No app features, routes, components, API handlers, or tests yet.
- Stray empty file `s-track` at project root — still pending cleanup.
- Spec is finalized (`Project-Spec.md`).

---

## Session History

### Session 2026-05-05 — Bootstrap context tracking
- Reviewed repo state (fresh Next.js 16 scaffold, no feature code).
- Created `Project-Context.md` to seed session continuity.
- No code changes.

### Session 2026-05-06 — Spec finalization & ground rules
- **Schema review**: caught typo (`cilent_id`), wrong types (`int` for money), missing FKs/indexes, missing PK on `project_contractor`, no `users` table, no `created_at/updated_at`. User opted not to fix the old schema — replaced wholesale with the procurement-focused schema.
- **Spec review**: pushed user to write a real spec before more SQL. Spec went from "construction PM app" (broad, blurry) to "procurement visibility dashboard" (sharp, testable).
- **Decisions locked** (see "Locked Decisions" above): multi-tenancy = SaaS, backend = FastAPI, frontend = Next 16, Supabase, variance = requested-vs-ordered, owner-only approval, notifications post-MVP.
- **Files created this session**:
  - `Project-Spec.md` — full updated spec with authorization matrix, audit rules, variance decision, schema draft.
  - `claude-rule.md` — coding rules: 80/20 split, ~50-line vertical slices, stop-and-wait cadence.
  - `learned.md` — user-owned learning log (Claude does not write here).
  - `README.md` — populated with project overview + task list section.
- **Files updated**: `Project-Context.md` (this file).
- **No code written** this session. Schema draft exists in `Project-Spec.md` but no SQL/migrations yet.
- **Next session goal**: finalize the schema and start writing SQL (migrations).
