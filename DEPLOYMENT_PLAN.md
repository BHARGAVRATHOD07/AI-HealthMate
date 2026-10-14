# AI HealthMate — Production Deployment Plan & Readiness Specification

**Document Version:** 1.1  
**Target Environment:**  
- **Frontend:** Vercel (Vite + React 19 Single Page Application)  
- **Backend:** Render (Express 5 REST API Web Service)  
- **Database:** MongoDB Atlas (M0/Shared or Dedicated Replica Set)  
- **AI Engine:** Google Gemini API  
- **Email Delivery:** SMTP (Gmail / SendGrid / Mailgun)

---

## 1. Executive Summary & Audit Status

Following the Phase 9.1 Deployment Readiness Audit:
- **Core Architecture:** Monorepo with independent `client/` and `server/` modules.
- **Backend Test Status:** **101 / 101 tests passed** (mock-isolated unit and regression suite).
- **Frontend Test & Lint Status:** **2 / 2 request-ID tests passed**, ESLint reported **0 errors / 0 warnings**, and Vite production build succeeded cleanly.
- **Deployment Verdict:** **CONDITIONAL GO** (requires adding Vercel SPA rewrites and setting all production environment variables).

---

## 2. System Architecture & Monorepo Topology

```
AI-HealthMate/
├── client/                     # Vite 8 + React 19 Frontend SPA (ESM)
│   ├── src/
│   │   ├── api/                # Network service layer & request factories
│   │   ├── pages/              # SPA route views (AIAssistant, Dashboard, etc.)
│   │   └── context/            # AuthContext, ThemeContext
│   ├── dist/                   # Static production bundle target
│   ├── package.json
│   └── vite.config.js
├── server/                     # Express 5 REST API (CommonJS)
│   ├── config/                 # Database initialization (Mongoose 9)
│   ├── controllers/            # Route controllers (AI, Auth, Conversations, etc.)
│   ├── middleware/             # JWT auth & error handlers
│   ├── models/                 # Mongoose schemas (Conversation, Message, User, etc.)
│   ├── routes/                 # Express route definitions & rate limiters
│   ├── services/               # Gemini AI orchestration & health context
│   ├── utils/                  # Nodemailer SMTP & HMAC helpers
│   ├── index.js                # Server entry point & HTTP listener
│   ├── package.json
│   └── .env.example
├── package.json                # Monorepo runner scripts
└── DEPLOYMENT_PLAN.md          # Production deployment guide
```

### Decoupled Service Separation
- **Backend (Render):** Deployed as a Node.js Web Service with **Root Directory** set to `server`.
- **Frontend (Vercel):** Deployed as a Static Site with **Root Directory** set to `client` and framework preset **Vite**.

```
                       ┌────────────────────────┐
                       │      Browser / User    │
                       └───────────┬────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
     (Static Assets)                              (API Calls)
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────┐
   │    Vercel Hosting    │                  │  Render Web Service  │
   │  (React 19 SPA)      │                  │  (Express 5 Backend) │
   └──────────────────────┘                  └──────────┬───────────┘
                                                        │
                                            ┌───────────┴───────────┐
                                            ▼                       ▼
                                 ┌────────────────────┐   ┌───────────────────┐
                                 │   MongoDB Atlas    │   │  Gemini AI & SMTP │
                                 │   (Replica Set)    │   │     Providers     │
                                 └────────────────────┘   └───────────────────┘
```

---

## 3. Environment Variables & Secrets Reference

### Backend Configuration (`server/.env` / Render Dashboard)

| Variable Name | Required | Default | Description / Recommended Value |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Optional | `development` | Set to `production` in Render dashboard. |
| `PORT` | Optional | `5000` | Port for Express listener. Automatically supplied by Render. |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas SRV URI with database name: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ai_healthmate?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | — | Cryptographically secure random secret (min 32 bytes): `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Optional | `7d` | Lifespan of issued JSON Web Tokens (e.g. `7d`, `24h`). |
| `PASSWORD_RESET_OTP_SECRET` | **Yes** | — | Secret for HMAC-SHA256 OTP hashing (min 32 bytes): `openssl rand -base64 32` |
| `GEMINI_API_KEY` | **Yes** | — | Google AI Studio API key used for assistant chat and health summaries. |
| `SMTP_HOST` | **Yes** | — | Mail server hostname (e.g. `smtp.gmail.com`, `smtp.sendgrid.net`). |
| `SMTP_PORT` | Optional | `587` | TCP port for SMTP. `587` (TLS) or `465` (SSL). |
| `SMTP_SECURE` | Optional | `false` | Set `"true"` for port 465, `"false"` for port 587. |
| `SMTP_USER` | **Yes** | — | Authenticated username / email address for SMTP provider. |
| `SMTP_PASS` | **Yes** | — | SMTP account password or Google App Password. |
| `SMTP_FROM` | Optional | `SMTP_USER` | Header displayed in recipients' inbox: `AI HealthMate <your_email@gmail.com>`. |
| `CLIENT_URL` | Optional | `*` | Recommended: URL of Vercel frontend to restrict CORS (e.g. `https://ai-healthmate.vercel.app`). |

### Frontend Configuration (`client/.env` / Vercel Dashboard)

| Variable Name | Required | Default | Description / Recommended Value |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** | `http://localhost:5000` | Deployed backend URL (e.g. `https://ai-healthmate-backend.onrender.com`). **Must NOT have a trailing slash.** |

*Important:* In Vite, `VITE_*` environment variables are statically inlined during `npm run build`. This variable must be configured in Vercel before the build is triggered.

---

## 4. Audit Findings: Blockers, Warnings & Mitigations

### 4.1 Blocker: Vercel SPA Route Rewrites
- **Finding:** The application relies on `react-router-dom` `BrowserRouter`.
- **Issue:** Without explicit rewrite rules, refreshing or directly loading routes such as `/dashboard`, `/assistant`, or `/medications` on Vercel returns a `404: NOT_FOUND` error.
- **Resolution:** Add `client/vercel.json` before testing live deep links:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### 4.2 Warning: Express Reverse-Proxy Trust (HIGH)
- **Finding:** `server/index.js` currently lacks `app.set("trust proxy", 1)`.
- **Issue:** On Render, incoming requests pass through a reverse proxy. Without trust proxy enabled, `express-rate-limit` in `authRoutes.js` reads Render's internal gateway IP instead of `req.ip`, causing all users to share the same rate-limit counter for logins and registrations.
- **Resolution:** Add `app.set("trust proxy", 1);` in `server/index.js`.

### 4.3 Warning: Open CORS Policy (MEDIUM)
- **Finding:** `server/index.js` uses `app.use(cors())` with open wildcards.
- **Issue:** Any third-party origin can make requests with Authorization headers to your backend.
- **Resolution:** Restrict allowed origins to the Vercel domain using `process.env.CLIENT_URL`.

### 4.4 Warning: Graceful Process Termination (MEDIUM)
- **Finding:** `server/index.js` does not listen for `SIGTERM` or `SIGINT`.
- **Issue:** Container redeployments on Render will abruptly kill running requests and database sessions.
- **Resolution:** Add `process.on("SIGTERM", ...)` to close the HTTP server and Mongoose connection cleanly.

---

## 5. Step-by-Step Deployment Roadmap

### Step 1: Provision MongoDB Atlas Cluster
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create an **M0 Shared Cluster** (free tier includes replica sets, required for transactions).
3. **Database Access:** Create an application user (e.g. `healthmate_admin`) with strong password.
4. **Network Access:** Add `0.0.0.0/0` (Allow Access from Anywhere) so Render dynamic container IPs can connect.
5. **Connection String:** Copy the SRV string and ensure the database name `ai_healthmate` is specified:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ai_healthmate?retryWrites=true&w=majority
   ```

---

### Step 2: Deploy Backend to Render

1. Sign in to [Render Dashboard](https://dashboard.render.com).
2. Click **New + > Web Service**.
3. Connect repository: `https://github.com/BHARGAVRATHOD07/AI-HealthMate`.
4. Configure service settings:
   - **Name:** `ai-healthmate-backend`
   - **Region:** Closest to your users (e.g. `Frankfurt`, `Oregon`, `Singapore`)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free` or `Starter`
5. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ai_healthmate?retryWrites=true&w=majority
   JWT_SECRET=<generated-32-byte-secret>
   JWT_EXPIRES_IN=7d
   PASSWORD_RESET_OTP_SECRET=<generated-32-byte-secret>
   GEMINI_API_KEY=<your-google-ai-studio-key>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=<your-gmail-address>
   SMTP_PASS=<your-google-app-password>
   SMTP_FROM=AI HealthMate <<your-gmail-address>>
   ```
6. Click **Deploy Web Service**.
7. Validate by visiting `https://<your-service>.onrender.com/`. Verify response:
   ```json
   { "message": "AI HealthMate Backend is running" }
   ```

---

### Step 3: Deploy Frontend to Vercel

1. Sign in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New... > Project** and import `BHARGAVRATHOD07/AI-HealthMate`.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and choose `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://<your-service>.onrender.com
   ```
   *(Ensure there is NO trailing slash).*
5. Ensure SPA rewrites are active by verifying `client/vercel.json` exists:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
6. Click **Deploy**. Note the assigned Vercel URL (e.g. `https://ai-healthmate.vercel.app`).

---

## 6. Post-Deployment Verification Checklist

Once both services are deployed and running, perform this end-to-end smoke test:

- [ ] **1. Backend Health Check:**
  `GET https://<backend-url>/` returns HTTP 200 with `{ message: "AI HealthMate Backend is running" }`.
- [ ] **2. User Registration:**
  Register a new account on `/register`. Verify redirection to `/dashboard` and valid JWT token saved in browser `localStorage`.
- [ ] **3. Session Persistence:**
  Refresh the browser while on `/dashboard`. Verify session remains active without redirecting to `/login`.
- [ ] **4. AI Assistant Chat:**
  Open `/assistant`, create a new conversation, send a health question, and verify streaming/rendering of the response from Gemini.
- [ ] **5. Chat History & Persistence:**
  Switch between conversations in the sidebar and reload the page. Confirm message history and timestamps are restored from MongoDB.
- [ ] **6. Health Summary Generation:**
  Trigger the AI Health Summary from the dashboard card. Confirm that vitals, records, and medications are aggregated into observations.
- [ ] **7. Password Reset via SMTP:**
  Navigate to `/login` > "Forgot password?", enter your email, and verify that the 6-digit OTP email arrives in your inbox within 60 seconds.
- [ ] **8. SPA Direct Navigation & Refresh:**
  Directly refresh the page on deep routes: `/dashboard`, `/assistant`, `/medications`, `/records`, `/reminders`. Verify **zero 404 errors**.

---

## 7. Rollback & Troubleshooting Guide

### Common Issues & Quick Fixes

| Symptom | Probable Cause | Quick Fix |
| :--- | :--- | :--- |
| `Cannot GET /dashboard` on page refresh | Missing Vercel SPA rewrite | Add `client/vercel.json` with rewrite rule `/* -> /index.html` and redeploy Vercel. |
| `Failed to fetch` or CORS error in browser console | Mismatched backend URL or backend is sleeping | Verify `VITE_API_URL` has no trailing slash and matches the exact Render URL. Allow 50s for Render free tier cold start. |
| Backend crash: `MONGODB_URI is not defined` | Missing environment variable on Render | Add `MONGODB_URI` in Render Environment dashboard and trigger manual redeploy. |
| MongoDB `MongoServerError: command delete requires a replica set` | Standalone MongoDB instance used | Ensure you are connecting to MongoDB Atlas (which runs as a replica set by default). |
| Rate limit: `Too many login attempts` immediately | Missing `trust proxy` setting behind Render | Add `app.set("trust proxy", 1);` in `server/index.js`. |
| Password reset email fails: `SMTP_NOT_CONFIGURED` | Missing SMTP credentials | Verify `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` in Render environment. If using Gmail, generate an App Password. |
