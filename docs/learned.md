# Learned — S.Track

Personal learning log. This file is **user-owned**. Claude does not write here directly — at most, Claude suggests a one-liner the user can paste in.

Capture things you actually understood (not just what got built). Vibe-coded output that you didn't read goes in commit messages, not here.

---

## Format

```
### YYYY-DD-MM — <topic>
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



### 2026-28-06 — Login & Dashboard page (frontend) connection with Supabase auth and GET endpoints (backend)
- What I learned (in my own words):
  - Refresher on react native's html body and that it is similar to next.js. Revision on how to write an async function
  - How to integrate supabase auth so that we can verify frontend's input (credential) against credentials that are stored inside supabase user's row
  - Writing another supabase integration to retrive user's access token and use that in an async function to get their corresponded material request using the GET endpoint we wrote yesterday
  - Started to understand the logic of getting the access token and why it is necessary.
- Why it matters / where it applies:
  - Being able to understand and integrate connections between frontend and backend are skills that are sought for within the industry and make a well rounded engineer
  - Most page in the future will rely on user input to retreive something from the database via using these endpoints
- Open question I still have:
  - No questions just still lost on the general html and javascript syntaxes especially the async functions and the whole writing supabase in the frontend stuff.

  ### 2026-29-06 — Material-Request and Items submission through frontend via POST endpoint
  ## Added PATCH endpoint for owner changing status of material request
- What I learned (in my own words):
  - integrated supabase and endpoint with typescript inside dashboard page for POST material-request endpoint
  - Starting to understand react and typescript syntaxes and usecase e.g. normal function and async function. And different useState syntax e.g. () => ... and that someFunction() runs automatically when opening the page
  - Saw differences in calling endpoint types such as GET calls and set a state whereas POST use JSON.stringify to then pass the object into FASTAPI
  - PATCH is used for changing a current attributes's state of row that already exist inside of the database
- Why it matters / where it applies:
  - Understanding pattern recognition in react and typescript syntax will compound into more efficient coding
  - Understanding the structure between endpoints and frontend
- Open question I still have:
  - N/A

  ### 2026-30-06 — POST Endpoint for purchase order , Splitting current request by status categorically in , Endpoint for deliveries. Caught a BIG DESIGN FLAW
  ## GET endpoints for purchase orders, wired it to frontend through nested react html.
- What I learned (in my own words):
  - Revision for writing POST endpoint for purchasing a requested order
    - body must come before depends arguments
    - db need to add , commit, refresh before able to loop through that added object
  - You could wrap react component inside of a function in typescript then proceed to print them via filtering (Status category)
  - Recognising big design flaw during variance calculation that the previous codebase were going to compare item name in request against ordered. which can create loophole with nameing variations. Changed order_item in supabase, schemas, and pydantics to make order_item reference request_item id so that we have direct link to what is being ticked off in request order
  - Learnt (kinda) and struggled (definitely) through writing purchase-order endpoint since we were wiring many schemas together.  the nested function for printing purchase order and per-item variances. adding conditional styles
- Why it matters / where it applies:
  -  API endpoints and react + typescript tech. useful patterns.
  - Recognising design flaw come from iterating through the system and recognise them while writing the code. just using sonnet without understanding the code would've caught this big flaw later when stages are implemented
- Open question I still have:
  - I am just still unsure about how to handle the other backend stuff like ids and things that arent passed from the frontend and can't be calculated
  - Everything was slowly making sense , but now its back to square one. feeling lost. Gotta keep pushing through.

  ### 2026-01-07 — GET endpoint for purchase-order with order id, Necessary for POST deliveries. Wired them to the frontend. New UI, per-items record states and order dropdown picker for fetching function
- What I learned (in my own words):
  - "|" is used for typescript variable's type annotation while "||" is used during runtime for logical operations
  - in endpoints, if we are passing id through url like /.../{id}/.. we could pass the id directly into the parameter
  - use backtick for urls inside of typescript so that javascript variable can interpolate `${...}`
  - tackled with wiring the endpoint in frontend was a pain. Learnt that during mapping, if out is onChange((e) => ....) which ever mapped index that is clicked return back the value = {...} we assigned into e. Which we then type converges into what we want to pass into the function
  - TypeScipt - useState declaration
    - Set<T> is used for checking existence
    - Record<K,V> is used for dict search
  - Map uses Variable.map((eachItem) => ({...}))   , ({...}) is necessary as it encapsulate and return an object otherwise it will read as function body
  - "Content-Type" : "application/json" tells FASTAPI (endpoint) that we are sending over json object to the endpoint (POST)
- Why it matters / where it applies:
  - these are syntaxes and typescript logics used for writing frontend work
- Open question I still have:
  -

  ### 2026-02-07 — POST delivery photos
- What I learned (in my own words):
  - Dealt with reading file in FASTAPI and creating Supabase bucket, which is inserted in the endpoint using f"...." which was new syntaxes
  - File was send in as parameter then await File.read() is used to give byte then sha256 something something turnt it into hash strings
  - File was used as input type in the frontend and the async function utilises FormData() which is new.
- Why it matters / where it applies:
  - hashing is done on the server side (fastapi) to prevent fraud of uploading the same byte i.e. 
- Open question I still have:
  - Formdata() purposes and syntax compared to normal type of input are still confusing to me.

  ### 2026-03-07 — 
- What I learned (in my own words):
  - 
- Why it matters / where it applies:
  - 
- Open question I still have:
  - 

  ### 2026-04-07 — 
- What I learned (in my own words):
  - 
- Why it matters / where it applies:
  - 
- Open question I still have:
  - 

<!-- Add new entries above this line -->
