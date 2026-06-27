# Learned — S.Track

Personal learning log. This file is **user-owned**. Claude does not write here directly — at most, Claude suggests a one-liner the user can paste in.

Capture things you actually understood (not just what got built). Vibe-coded output that you didn't read goes in commit messages, not here.

---

## Format

```
### YYYY-MM-DD — <topic>
- What I learned (in my own words):
- Why it matters / where it applies:
- Open question I still have:
```

---

## Entries

### 2026-24-06 — Postgres
- What I learned (in my own words):
  - Basic postgres syntaxes that translated from ERD diagram in mysqlworkbench. 
  - Applying the postgres onto supabase and creating an initial database
  - Postgres has same logic as normal mysqlworkbench but different syntax so it was quite easy to understand
- Why it matters / where it applies:
  - Learning postgres is required as supabase need them to run.
- Open question I still have:
  - How I would actually implement the logic and create the actual running backend.

  ### 2026-26-06 — Backend stuffs
- What I learned (in my own words):
  - postgres is for supabase but for our backend to understand the database we need to write sql in python 
  - There are many tools in which i haven't fully understand what each of them do yet e.g. uvicorn, and others i forgot.
  - copied some links from supabase to connect with database setup inside backend folder
- Why it matters / where it applies:
  - learning the architectural of the backend and how database and bankend codes are connected, believe this is called SQLAlchemy?
- Open question I still have:
  - everything is confusing right now and i dont have a specific question. Ten, in 6 months, if you understand even 50% of these. I am proud of you.

  ### 2026-27-06 — API endpoints, Pydantic schema, 
  ## API -> SQLAlchemy <- Pydantic schema relations 

- What I learned (in my own words):
  - Writing pydantic schema models, which defines what attribute from the SQLAlchemy is inputted from the frontend.
  - Writing API Endpoints that uses SQLAlchemy models as templates and pydantic as reference to then fill in the other attribute inside SQLAlchemy's table that isn't passed by the frontend using backend logic
- Why it matters / where it applies:
  - Understanding the strucutre will allow me to know what is passed and what needs to be filled
  - API endpoints is one of the main feature in writing backend, gaining deeper understanding of this compounds as I write more endpoints
- Open question I still have:
  - N/A

  ### 2026-27-06 — Auth Wiring

- What I learned (in my own words):
  - Auth wiring by instead of hardcoding ids, create a test user, company, and project inside of supabase.
  - Simulate endpoint with test user id using swagger doc
  - Created command to retreive access key using anon key and user credential do then test endpoints in swagger docs.
- Why it matters / where it applies:
  - Auth wiring is necessary because in development , auth and endpoint testing are required before having a frontend so that we can test out endpoint logics.
- Open question I still have:
  - Still don't know what anon really is. Basically the authorize process is still unclear, why did we need access token? 
  - is what we did manual testing. for example if we have frontend done, when user want to do material request they would need to be authorized using the access key which is generated in the backend automatically. But since we dont have that we need to run command with anon key and user password to generate and input that access key so that we can have access to material request endpoint?
  - Is Auth wiring the idea of generating test user,companies etc. then run endpoints, or is it the process or linking user id with company id inside auth.py so that we can use endpoint with real data?
<!-- Add new entries above this line -->
