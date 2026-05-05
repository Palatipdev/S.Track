# Project Context — S.Track

> Rolling log of session-level context. Each session appends a new entry under **Session History** so the next session can pick up without re-deriving state. Keep entries short and factual — code itself is the source of truth.

---

## Project Snapshot

- **Repo**: `S.Track` (GitHub: `Palatipdev/S.Track`)
- **Stack**: Next.js `16.2.3` (App Router), React `19.2.4`, Tailwind CSS v4, TypeScript 5
- **Important**: This Next.js version has breaking changes vs. older versions. Always consult `node_modules/next/dist/docs/` before writing Next-specific code (per `AGENTS.md`).
- **Working directory**: `C:\Users\riaza\Documents\s-track`
- **Platform**: Windows 11, PowerShell

## Current State (as of 2026-05-05)

- Boilerplate `create-next-app` scaffold only — `app/page.tsx` is the default landing page, `app/layout.tsx` wires Geist fonts.
- No app features, routes, components, API handlers, or tests yet.
- `README.md` is effectively empty.
- Repo has a stray empty file named `s-track` at the project root (likely accidental — candidate for cleanup).
- Git: branch `main`, 4 commits, all initial scaffolding. Working tree has untracked scaffold files only.

## Conventions & Constraints

- Follow `AGENTS.md`: do not assume legacy Next.js APIs/conventions; verify against local docs.
- Tailwind v4 (PostCSS plugin via `@tailwindcss/postcss`).
- ESLint via `eslint-config-next` (run `npm run lint`).
- Scripts: `npm run dev` / `build` / `start` / `lint`.

## Open Questions / TODO Backlog

- [ ] Decide product scope for "S.Track" (no spec yet in repo).
- [ ] Write a real `README.md`.
- [ ] Investigate / remove the stray `s-track` file at project root.
- [ ] Set up a basic feature branch + PR workflow if collaborating.

---

## Session History

### Session 2026-05-05 — Bootstrap context tracking
- Reviewed repo state (fresh Next.js 16 scaffold, no feature code).
- Created this `Project-Context.md` to seed session continuity.
- No code changes.

<!--
Template for the next session:

### Session YYYY-MM-DD — <short title>
- **Goal**: …
- **Changes**: files touched, key commits.
- **Decisions**: any non-obvious choices and why.
- **Unfinished**: what's mid-flight, where to resume.
- **Next**: explicit next step for the following session.
-->
