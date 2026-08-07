# FraudGuard AI — Single-Service Render Deployment Guide

This document describes how to deploy FraudGuard AI as a single Render Web Service.

---

## 1. Architecture Overview
- **Deployment Platform**: Render (Web Service)
- **Frontend & Backend**: Bundled together. React is compiled to static assets (`frontend/dist`) and served directly by FastAPI.
- **Database**: SQLite database file (`fraudguard.db`) stored on a persistent Render volume.

---

## 2. Render Web Service Configuration

### A. Environment Variables
Configure the following in the Render environment settings:
- `GEMINI_API_KEY`: *Your Google Gemini API Key*
- `LLM_PROVIDER`: `gemini` (or `heuristic` for fallback test)
- `JWT_SECRET_KEY`: *A strong random secret key (e.g. generated via `openssl rand -hex 32`)*
- `ALLOWED_ORIGINS`: `https://your-service.onrender.com`
- `DATABASE_URL`: `sqlite:////var/data/fraudguard.db`
- `ENABLE_DEMO_RESET`: `true`

### B. Persistent Disk Volume
Mount a persistent disk on Render:
- **Mount Path**: `/var/data`
- **Size**: `1 GiB` (more than enough for SQLite logs and records)

### C. Build & Start Commands
- **Build Command**:
  ```bash
  pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
  ```
- **Start Command**:
  ```bash
  cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### D. Health Check
- **Path**: `/health` (returns 200 immediately without hitting database or LLMs)

---

## 3. Troubleshooting: Why Render Only Serves Backend JSON

### Root Cause
The `frontend/dist` directory is ignored by Git (`.gitignore`) to avoid committing binary build artifacts. Therefore, when Render clones your repository from GitHub, the frontend build files do not exist initially.

If your Render Web Service **Build Command** only ran `pip install -r backend/requirements.txt`, Node/Vite never compiled the React frontend assets (`frontend/dist/index.html`). As a result, FastAPI falls back to serving the API status JSON instead of the React dashboard.

### Fix (Single Web Service Deployment)
1. Go to **Render Dashboard** -> Select your **Web Service** -> **Settings**.
2. Scroll to **Build Command** and change it to:
   ```bash
   pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
   ```
3. Ensure **Start Command** is set to:
   ```bash
   cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. Click **Save Changes**.
5. Click **Manual Deploy** -> **Clear build cache & deploy**.

---

## 4. Alternative: Deploying Frontend & Backend Separately on Render

If you prefer deploying the frontend as a dedicated Render **Static Site** (100% Free on Render) and backend as a **Web Service**:

### A. Backend Service (Web Service)
- **Environment**: Python
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**: Set `ALLOWED_ORIGINS` to `https://your-frontend-name.onrender.com`

### B. Frontend Service (Static Site)
- **Environment**: Node
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/dist`
- **Rewrite Rules**: Route `/*` to `/index.html` (SPA Routing)

