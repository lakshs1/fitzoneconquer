# FitZone AI Coach Backend

## Local Run (Python)
1. Create `.env` in `backend/` with:
   ```
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_TEMPERATURE=0.6
   ```
2. Install deps and run:
   ```
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```
3. Frontend uses `VITE_AI_COACH_URL` (e.g. `http://localhost:8000`).

## Docker Run
1. Build image:
   ```
   cd backend
   docker build -t fitzone-ai-coach .
   ```
2. Run:
   ```
   docker run --env-file .env -p 8000:8000 fitzone-ai-coach
   ```

## Deployment (General Steps)
1. Pick a host that runs Docker or Python web apps (Render, Railway, Fly.io, Cloud Run, etc.).
2. Set environment variables on the host:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (optional)
   - `GEMINI_TEMPERATURE` (optional)
3. Deploy either:
   - Docker image (preferred), or
   - Directly from the repo using `uvicorn main:app`.
4. After deploy, set `VITE_AI_COACH_URL` in the frontend to the public URL of the service.

## Health Check
- `GET /health` should return `{ "status": "ok" }`.
