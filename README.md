# S.Track

Construction materials procurement visibility dashboard. Replaces Excel + WhatsApp for small-to-mid construction firms. Multi-tenant SaaS.

## Repo layout
```
/
├── frontend/      Next.js 16 app (Vercel deploy)
├── backend/       Python FastAPI service (coming next sessions)
├── docs/          Project spec, context, rules, learning log
├── README.md
├── AGENTS.md      Next.js 16 agent rules
└── CLAUDE.md      Claude Code project instructions
```

## Stack
- **Frontend**: Next.js 16.2.3 (App Router), React 19, Tailwind v4, TypeScript
- **Backend**: Python FastAPI + SQLAlchemy
- **DB / Storage / Auth**: Supabase (Postgres + Storage + Auth)
- **Hosting**: Vercel (frontend), Railway or Fly.io (FastAPI)

## Documents to read in order

| File | Purpose |
|---|---|
| `docs/Project-Context.md` | Where we left off last session. Read first. |
| `docs/Project-Spec.md` | What we're building. The product spec. |
| `docs/claude-rule.md` | How Claude must write code on this project (80/20, vertical slices). |
| `docs/learned.md` | User's personal learning log. User-owned. |
| `AGENTS.md` | Reminder: Next.js 16 has breaking changes — consult `frontend/node_modules/next/dist/docs/`. |

## Scripts
Run from `frontend/`:
```
cd frontend
npm run dev     # Next.js dev server
npm run build
npm run lint
```
FastAPI scaffolding is not in the repo yet — coming next sessions.

---

## Tasks

### Schema — done
- [x] Lock the schema in `docs/Project-Spec.md`.
- [x] Write Postgres DDL — `sql/schema.sql` (15 tables, 5 enums).
- [x] Create Supabase project (Tokyo, Data API off, RLS auto-enable on).
- [x] Apply schema to Supabase; all 15 tables confirmed live.
- [ ] Capture Supabase connection string + service role key in `.env.local` (do NOT commit).
- [ ] Add Row-Level Security (RLS) policy stubs scoped by `company_id`.

### Next session — backend scaffold
- [ ] Scaffold `backend/` with FastAPI + SQLAlchemy + Alembic.
- [ ] Write first Alembic migration matching `sql/schema.sql`.
- [ ] First vertical slice: `POST /material-requests` end-to-end (DB → API → Next form).

### Backlog
- [ ] Auth wiring: Supabase Auth on Next.js, JWT verification on FastAPI.
- [ ] Photo upload pipeline (Supabase Storage → server-side sha256 → `delivery_photos`).
- [ ] Owner approval queue UI.
- [ ] Variance calc (requested vs ordered, >10% threshold).
- [ ] Procurement dashboard.
