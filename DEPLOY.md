# Deploying SorTrack

Two pieces: the FastAPI backend and the Next.js frontend. Deploy the backend first, then point the frontend at it. The database (Supabase Postgres) is already live, so nothing to deploy there.

The code is already prepared for this:
- Frontend reads the backend URL from `NEXT_PUBLIC_API_URL` (falls back to localhost for dev).
- Backend allows the deployed frontend origin via `FRONTEND_URL`.
- `backend/requirements.txt`, `backend/Procfile`, and `backend/runtime.txt` are in place.

---

## 1. Backend → Render (or Railway)

**Render (free tier works for a demo):**
1. render.com → New → Web Service → connect the `Palatipdev/S.Track` repo.
2. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Environment variables** (copy the values from `backend/.env` locally):
   - `DATABASE_URL` — the Supabase pooler connection string
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL` — set this **after** step 2 to the Vercel URL (e.g. `https://sortrack.vercel.app`)
4. Deploy. Note the service URL, e.g. `https://sortrack-api.onrender.com`.
5. Smoke test: open `https://<your-backend>/health` — should return the health response.

> Render free instances sleep after inactivity and cold-start in ~30-60s. Fine for a portfolio demo; hit `/health` once before showing it to wake it.

**Railway** is equivalent: New Project → deploy from repo → set Root Directory to `backend` → add the same env vars. Railway auto-detects the `Procfile`.

## 2. Frontend → Vercel

1. vercel.com → New Project → import the `Palatipdev/S.Track` repo.
2. Settings:
   - **Root Directory**: `frontend`
   - Framework preset: Next.js (auto-detected)
3. **Environment variables**:
   - `NEXT_PUBLIC_API_URL` — the backend URL from step 1 (e.g. `https://sortrack-api.onrender.com`)
   - `NEXT_PUBLIC_SUPABASE_URL` — same as backend's `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — same as backend's `SUPABASE_ANON_KEY`
4. Deploy. Note the URL, e.g. `https://sortrack.vercel.app`.

## 3. Close the loop

1. Back in Render/Railway, set `FRONTEND_URL` to the Vercel URL and redeploy the backend (so CORS allows the browser origin).
2. Open the Vercel URL, log in with the test user, and walk PO → receive → stock → withdraw.

## 4. Demo data

If the demo DB is empty or messy, re-seed with `sql/demo_seed.sql` (and optionally `sql/demo_seed_multiloc.sql`) via the Supabase SQL editor. See the truncate command in chat history if you need to reset first.

---

## Notes

- A test login user must exist in Supabase Auth with a matching `users` row (company_id 1). If you don't have one handy, create it in the Supabase dashboard before demoing.
- Delivery-photo upload writes to the Supabase Storage `delivery-photos` bucket; that already exists.
- Keep `backend/.env` and `frontend/.env.local` out of git (they hold secrets). The deploy platforms hold their own copies via the env-var settings above.
