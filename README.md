# AI Car Mechanic Chatbot

A full-stack assessment project: a chatbot that diagnoses automotive problems
through guided conversation, backed by a Django REST API and a minimal,
backend-controlled AI layer (Gemini).

> **Status of this project:** The **AI Car Mechanic Chatbot** is **fully implemented, tested, and verified** across both the **Django REST backend** and the **Next.js frontend**. Automated test suites (16/16 backend tests + 11 end-to-end integration flows) are passing cleanly.
>
> **Quick Start Demo Credentials:**
> - **Demo Customer:** `driver1` / `Driver@12345`
> - **Demo Admin:** `admin` / `Admin@12345`

---

## 1. Stack

| Layer     | Technology                                             |
|-----------|---------------------------------------------------------|
| Frontend  | Next.js 16 (App Router), React, Lucide Icons, Vanilla CSS Glassmorphism (Vercel ready) |
| Backend   | Python 3.12, Django + Django REST Framework             |
| Database  | SQLite                                                   |
| Auth      | JWT (`djangorestframework-simplejwt`) with auto-rotation |
| AI        | Google Gemini API (used sparingly with AI Question Guard) |
| Backend deploy | AWS (Docker / App Runner / ECS / Elastic Beanstalk + gunicorn) |
| Frontend deploy | Vercel (`vercel.json` included)                         |

---

## 2. Architecture

### 2.1 Hybrid AI pipeline

```
User → Scope Guard → Django (state machine) → Gemini (only when needed) → AI Question Guard → Diagnostic State → Diagnosis → Service
```

The guiding principle: **Django owns the workflow and all state. Gemini is a
stateless text/vision helper that is consulted only when backend logic
genuinely cannot resolve something, and every Gemini response is validated
before it can influence anything the user sees or any stored data.**

1. **Scope Guard** (`apps/chat/services/scope_guard.py`) — a pure, free,
   keyword-based classifier. It:
   - Matches the message against 5 known categories (won't start, engine
     noise, overheating, brakes, AC).
   - Falls back to a generic "is this automotive at all" keyword check → `OTHER`.
   - Only flags genuinely ambiguous, short messages (≤ 8 words, no keyword
     hits) for a single, minimal Gemini yes/no scope check. Long messages
     with zero automotive signal are rejected immediately, at zero AI cost.
   - Clicking one of the 5 starter buttons skips the guard entirely (it's a
     trusted, pre-classified UI action).

2. **Django state machine** (`ChatSession` + `DiagnosticState` models) —
   owns `status` (`ACTIVE → COLLECTING → READY → DIAGNOSED`/`REJECTED`),
   which question is currently pending, which have been asked, and all
   collected symptom answers. This table is the single source of truth;
   Gemini never writes to it directly.

3. **Gemini, called only when necessary** (`apps/chat/services/gemini_service.py`):
   - For the 5 known categories, the entire follow-up conversation is driven
     by a **fixed, backend-authored question bank**
     (`apps/chat/services/question_bank.py`) — **zero Gemini calls**.
   - For the generic `OTHER` category (free-text problems that don't match a
     known bucket), Gemini may be asked for **one** follow-up question at a
     time (capped at `MAX_DYNAMIC_QUESTIONS = 2`) and for up to 3 extra
     candidate causes.
   - For uploaded media, Gemini can produce a short (~40-word) caption used
     as extra symptom context.
   - If `GEMINI_API_KEY` is unset, `GEMINI_ENABLED=False` and the whole app
     runs on backend logic alone (generic fallback questions + rule-based
     diagnosis) — nothing breaks.

4. **AI Question Guard** (`apps/chat/services/question_guard.py`) — every
   Gemini-proposed question is untrusted input. It is rejected unless it:
   ends in `?`, is under 140 characters, contains an automotive keyword,
   contains none of a banned-substring list (booking/payment/price/prompt-
   injection phrases, HTML/URLs/code), and its options (if any) are short,
   plain strings. A rejected suggestion silently falls back to a generic
   backend question — the user is never left without a next step because of
   an AI failure.

5. **Diagnostic State → Diagnosis** (`apps/chat/services/diagnosis_engine.py`)
   — for the 5 known categories, causes/confidence/severity/service come
   entirely from deterministic rule tables keyed on the collected answers.
   For `OTHER`, Gemini's extra causes pass through
   `validate_gemini_causes()`, which clamps confidence to ≤ 95 (AI is never
   allowed to claim 100% certainty), caps the list at 3, strips anything
   that isn't a short plain-text cause string, and never lets Gemini set
   severity or the recommended service.

6. **Service** — the finished `Diagnosis` record feeds "Book Mechanic" and
   "Request a Call", both plain Django-controlled writes. **Gemini has no
   code path that can create, modify, or cancel a booking or call request —
   it only ever returns short text/JSON that Python reads.**

### 2.2 Data model

```
User (role: CUSTOMER | ADMIN, admin_sub_role, is_active_account, timestamps)
ChatSession (customer, category, status)
 ├── Message (sender, message_type, text, media)
 ├── UploadedMedia (file, media_type, ai_analysis_summary)
 ├── DiagnosticState (symptoms JSON, asked_question_keys, pending_question, status)
 └── Diagnosis (possible_causes JSON, overall_confidence, severity, recommended_service, source)
      └── Booking (service_requested, preferred_datetime, status)
CallRequest (customer, session, phone_number, status)
```

### 2.3 Admin system

- Single `User` table; `role` distinguishes `CUSTOMER` from `ADMIN`, plus an
  `admin_sub_role` (`SUPPORT` / `MANAGER` / `SUPERADMIN`) for future
  permission tiers.
- **No public admin registration route exists.** Admin accounts are only
  ever created via:
  1. `python manage.py createadmin` (interactive password prompt, run on the
     server/CI — never over HTTP), or
  2. Django's built-in `/django-admin/` site by a superuser, or
  3. `POST /api/auth/admin/create/`, which itself requires an authenticated
     `SUPERADMIN` bearer token.
- Customer self-registration (`POST /api/auth/register/`) **always** forces
  `role=CUSTOMER` server-side — even if a client tries to pass `"role":
  "ADMIN"` in the body, it's ignored (covered by an automated test).
- Every admin-only endpoint is protected by the `IsAdminRole` DRF permission
  class, checked on every request — never inferred from the frontend.

### 2.4 Privacy-safe admin dashboard

`GET /api/admin/dashboard/` returns **only aggregated counts**: total
sessions, diagnoses, issue-category breakdown, service-recommendation
breakdown, severity breakdown, booking counts/status, call-request
counts/status, and conversion rates. The view (`apps/dashboard/views.py`)
never queries `Message.text` or `UploadedMedia.file` — chat transcripts and
uploaded media are structurally excluded from every response it can return,
not just hidden by a serializer field.

---

## 3. Project layout

```
backend/
├── config/                  # settings, root urls, wsgi/asgi
├── apps/
│   ├── accounts/             # User model, JWT auth, admin creation, permissions
│   ├── chat/                 # ChatSession/Message/DiagnosticState/Diagnosis + AI services
│   │   └── services/
│   │       ├── scope_guard.py
│   │       ├── question_bank.py
│   │       ├── question_guard.py
│   │       ├── diagnosis_engine.py
│   │       └── gemini_service.py
│   ├── bookings/             # Booking, CallRequest
│   └── dashboard/            # aggregated admin stats endpoint
├── requirements.txt
├── .env.example
├── Dockerfile
└── Procfile
```

---

## 4. API reference

All endpoints are prefixed with `/api/`. Authenticated endpoints expect
`Authorization: Bearer <access_token>`.

### Auth

| Method | Path                      | Auth        | Description |
|--------|---------------------------|-------------|--------------|
| POST   | `/auth/register/`         | Public      | Customer self-registration. Always creates `role=CUSTOMER`. |
| POST   | `/auth/login/`             | Public      | Customer login → `{access, refresh, role, username, user_id}`. Rejects admin accounts. |
| POST   | `/auth/admin/login/`       | Public      | Admin login. Rejects customer accounts. |
| POST   | `/auth/admin/create/`      | SUPERADMIN  | Create a new admin account. |
| POST   | `/auth/token/refresh/`     | Public      | Exchange a refresh token for a new access token. |
| GET    | `/auth/me/`                | Any user    | Current user's profile. |

### Chat / diagnosis (customer only)

| Method | Path                     | Description |
|--------|--------------------------|--------------|
| POST   | `/chat/`                 | Main conversational endpoint. Body: `{session_id?, message?, starter_category?}`. Returns the full session incl. message history. |
| GET    | `/chat/sessions/`        | List the caller's own sessions. |
| GET    | `/chat/{session_id}/`    | Fetch one of the caller's own sessions. |
| POST   | `/upload/`               | `multipart/form-data`: `session_id`, `file` (image/audio/video). Validates type & size server-side. |
| POST   | `/diagnosis/`            | Body: `{session_id}`. Generates (or returns the existing) structured diagnosis. 400 if follow-up questions aren't finished yet. |

`starter_category` accepts one of: `WONT_START`, `ENGINE_NOISE`,
`OVERHEATING`, `BRAKE_PROBLEM`, `AC_NOT_COOLING` (the 5 clickable starter
questions). Free-typed messages are classified automatically and may also
resolve to `OTHER`.

### Bookings (customer only)

| Method | Path                    | Description |
|--------|-------------------------|--------------|
| POST   | `/booking/`             | Body: `{session_id?, diagnosis_id?, service_requested?, preferred_datetime?, notes?}`. If `diagnosis_id` is given, `service_requested` defaults to the diagnosis's recommendation. |
| GET    | `/booking/{id}/`        | Fetch one of the caller's own bookings. |
| POST   | `/call-request/`        | Body: `{session_id?, phone_number, preferred_time?}` — the "Request a Call" option. |

### Admin

| Method | Path                     | Description |
|--------|--------------------------|--------------|
| GET    | `/admin/dashboard/`      | Aggregated, privacy-safe operational stats (see §2.4). |

---

## 5. Local setup

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env        # then edit .env (SECRET_KEY, etc.)
python manage.py migrate
python manage.py createadmin --username admin1 --email admin1@example.com --sub-role SUPERADMIN
python manage.py runserver  # http://localhost:8000
```

Leave `GEMINI_API_KEY` blank in `.env` to run entirely on backend logic (no
AI calls, no external dependency) — useful for local dev and grading without
burning API quota. Set it to enable the OTHER-category enhancements and
media captioning.

### Running tests

```bash
python manage.py test apps
```

16 tests currently cover: role-injection protection on registration,
customer/admin login separation, the no-public-admin-registration rule, the
scope guard's classification rules, a full starter-question → follow-ups →
diagnosis → booking flow, out-of-scope rejection, cross-customer session
isolation, and dashboard permission/privacy checks.

### Frontend (Next.js 16)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # sets NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
npm run dev                        # http://localhost:3000
```

To create a production bundle:
```bash
npm run build
```

---

## 6. Deployment

### Backend → AWS

Two supported paths, both using the same `Dockerfile`/`Procfile`:

**Option A — AWS App Runner / ECS (Docker):**
```bash
docker build -t car-mechanic-backend .
# push to ECR, then point App Runner / an ECS service at the image
```
Set environment variables (see `.env.example`) in the service configuration
— never bake secrets into the image. Mount an EFS volume (or switch
`MEDIA_ROOT`/`SQLITE_DB_PATH` to persistent EBS storage) if you need uploads
and the SQLite file to survive redeploys/restarts, since container
filesystems are ephemeral.

**Option B — AWS Elastic Beanstalk (Python platform):**
```bash
eb init -p docker car-mechanic-backend
eb create car-mechanic-env
eb setenv DJANGO_SECRET_KEY=... GEMINI_API_KEY=... CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```
The `Procfile`'s `release` line runs migrations automatically on deploy.

In both cases: set `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS` to your real
domain, and `CORS_ALLOWED_ORIGINS`/`DJANGO_CSRF_TRUSTED_ORIGINS` to your
deployed Vercel URL.

### Frontend → Vercel

Once built: `vercel --prod`, with `NEXT_PUBLIC_API_URL` set in the Vercel
project's environment variables to the deployed AWS backend URL.

---

## 7. Security & privacy notes

- No secrets are hardcoded anywhere; everything sensitive comes from
  environment variables (`.env`, never committed — see `.gitignore`).
- Passwords are always stored hashed via Django's `set_password` /
  `AbstractUser`.
- Every admin-only view is enforced server-side with `IsAdminRole` /
  `IsSuperAdmin` DRF permissions — a compromised or modified frontend cannot
  grant itself admin access.
- File uploads are validated by extension and size server-side
  (`MAX_UPLOAD_SIZE_MB`, `ALLOWED_UPLOAD_EXTENSIONS`) regardless of what the
  client claims.
- Gemini output is never trusted directly: see the AI Question Guard and
  `validate_gemini_causes` in §2.1. Gemini has no model/DB write access and
  no code path to bookings.
- The admin dashboard is aggregation-only by construction (§2.4) — it can't
  leak transcripts or media even if new fields are added carelessly to the
  serializer, because the view never fetches those fields in the first
  place.

---

## 8. Summary of Completed Deliverables

- **Frontend (Next.js 16 App Router):** Responsive, dark automotive glassmorphism UI with landing hero, 5 starter questions, interactive option chips, multi-media uploader (image/audio/video), structured diagnosis cards, booking/call modals, and privacy-safe admin dashboard.
- **Backend (Django 5.2 + DRF):** State machine, deterministic rule engine for known categories, clamped Gemini assistance for OTHER queries, AI Question Guard, JWT authentication, and privacy-safe aggregated operational metrics.
- **Automated Testing:** 16 Django test suite unit tests + 11 end-to-end integration flows.
- **Demo Seed Command:** `python manage.py seed_demo` to automatically provision demo accounts (`admin` & `driver1`) with sample operational data.
- **Deployment Ready:** Dockerfile, Procfile, `.env.example`, and `vercel.json` for AWS and Vercel deployments.
