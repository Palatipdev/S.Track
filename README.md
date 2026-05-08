# S.Track

Construction materials procurement dashboard. Replaces Excel and WhatsApp for small-to-mid construction firms. Multi-tenant: every record scoped to a company.

## Repo layout
```
/
├── frontend/      Next.js 16 app (Vercel deploy)
├── backend/       Python FastAPI service (not yet scaffolded)
├── sql/           Database design (MySQL Workbench ERD; Postgres migrations land in backend/ once scaffolded)
├── docs/          Project spec, context, rules, learning log
├── README.md
├── AGENTS.md
└── CLAUDE.md
```

## Stack
- **Frontend**: Next.js 16.2.3 (App Router), React 19, Tailwind v4, TypeScript
- **Backend**: Python FastAPI + SQLAlchemy
- **DB / Storage / Auth**: Supabase (Postgres + Storage + Auth)
- **Hosting**: Vercel (frontend), Railway or Fly.io (FastAPI)

## Documents

| File | Purpose |
|---|---|
| `docs/Project-Spec.md` | Product spec. |
| `docs/Project-Context.md` | Session context log. |
| `docs/learned.md` | Personal learning log. |
| `AGENTS.md` | Reminder: Next.js 16 has breaking changes. Consult `frontend/node_modules/next/dist/docs/`. |

## Scripts
Run from `frontend/`:
```
cd frontend
npm run dev     # Next.js dev server
npm run build
npm run lint
```
FastAPI scaffolding is not in the repo yet.

---

## Tasks

### Next session: translate ERD to Postgres
- [ ] Translate `sql/database-table.mwb` to Postgres DDL (snake_case plural, `bigint generated always as identity`, `timestamptz`, `numeric(14,2)`, Postgres enums).
- [ ] Create Supabase project; capture connection string + service role key in `.env.local` (do NOT commit).
- [ ] Scaffold `backend/` with FastAPI + SQLAlchemy + Alembic.
- [ ] First migration: `companies`, `users` (with `role` enum), `projects`, `project_members`.
- [ ] Apply migration to Supabase; verify in dashboard.
- [ ] Add Row-Level Security (RLS) policy stubs scoped by `company_id`.
- [ ] Subsequent migrations: append-only event tables and `delivery_photos` with `sha256`.

### Backlog (after schema lands)
- [ ] First vertical slice: `POST /material-requests` end-to-end (DB to API to Next form).
- [ ] Auth wiring: Supabase Auth on Next.js, JWT verification on FastAPI.
- [ ] Photo upload pipeline (Supabase Storage to server-side sha256 to `delivery_photos`).
- [ ] Owner approval queue UI.
- [ ] Variance calc: requested vs ordered, 10% threshold.
- [ ] Procurement dashboard.
