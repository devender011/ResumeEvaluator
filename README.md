# Resume Lens

Resume Lens is a small FastAPI + React app for reviewing resumes. It accepts PDF and UTF-8 `.txt` files, requires evaluation criteria, shows a document preview and extracted text, then returns a score and written evaluation using Groq.

## Run the backend

From the repository root, prepare the backend environment and add your Groq API key and Redis connection URL to `backend/.env`:

```powershell
Set-Location backend
Copy-Item .env.example .env
uv sync
uv run uvicorn index:app --reload
```

Set `REDIS_URL` in `.env` before analyzing resumes. For local development, use a local Redis URL; for Upstash, use the TLS TCP connection URL from the database's Connect page. Without Redis, the API can start in development but `/api/analyze` returns `503`.

The API listens at `http://localhost:8000`; interactive API docs are at `http://localhost:8000/docs`.

## Run the frontend

In another terminal, from the repository root:

```powershell
Set-Location frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`). Set `VITE_API_URL` in `frontend/.env` if the backend runs at a different address.

## Production checklist

Configure these values in the API host's secret/environment settings:

- `APP_ENV=production` disables the interactive API docs and requires production CORS and host allowlists.
- `GROQ_API_KEY` stays on the backend. Never add it to a `VITE_` variable.
- `REDIS_URL` is the private Redis connection URL. Production startup fails if it is missing or Redis cannot be reached.
- `CORS_ORIGINS` is the comma-separated list of exact HTTPS frontend origins.
- `ALLOWED_HOSTS` is the comma-separated list of API hostnames.
- `MAX_CONCURRENT_ANALYSES` caps simultaneous Groq calls per API process; the default is 2.
- `VITE_API_URL` is the API's HTTPS URL and must be set when building the frontend.

The API rejects uploads over 2 MB, PDFs over 10 pages, and extracted text over 50,000 characters. Redis allows at most 20 LLM attempts per source IP in a rolling 24-hour window, shared across API workers and restarts. It stores hashed IP keys that expire automatically; it does not store resumes. The Vercel backend reads its platform generated client IP header; local development uses the direct connection address. The hosting proxy must also reject request bodies above the upload limit plus multipart overhead, because it parses the upload before the application endpoint runs. Configure authentication before making `/api/analyze` public.

Resume text is sent to Groq for inference. The app does not persist uploaded files or extracted text. Review Groq's data handling and publish a privacy notice that fits your users and use case.

## Deploy to Vercel

This repository is configured as two Vercel projects using the same Git repository. In the API project's settings, enable Vercel's automatically exposed system environment variables so the API can identify trusted platform client IP headers for Redis rate limiting:

1. Create the frontend project with the project root set to `frontend`. Vercel uses the included `frontend/vercel.json` to install with `npm ci`, run the Vite build, and publish `dist`.
2. Create the API project with the project root set to `backend`. Vercel detects the FastAPI application exported as `app` from `index.py`, installs dependencies from `pyproject.toml` and `uv.lock`, and applies the 60-second function duration in `backend/vercel.json`.
3. Deploy the API once, then set `VITE_API_URL` on the frontend project to the API's HTTPS origin (for example, `https://your-api.vercel.app`) for Production and Preview as needed. Redeploy the frontend after setting it; Vite embeds this public URL at build time.
4. Set the API project's environment variables for Production:

   - `APP_ENV=production`
   - `GROQ_API_KEY` — secret from Groq
   - `GROQ_MODEL=qwen/qwen3.8-27b` — optional; this is the current default
   - `REDIS_URL` — TLS TCP URL from your Redis provider, such as Upstash
   - `CORS_ORIGINS=https://your-frontend.vercel.app` — exact frontend origin, without a trailing slash
   - `ALLOWED_HOSTS=your-api.vercel.app` — API hostname only, without `https://`
   - `MAX_CONCURRENT_ANALYSES=2` — optional

   Redeploy the API after adding these settings. Add your custom domain to the corresponding CORS and host settings if you use one. Preview frontend domains also need to be listed in `CORS_ORIGINS` to call the API.

The 2 MB application upload cap fits under Vercel Functions' 4.5 MB request body limit, including multipart overhead. The API needs Redis because the 20 calls per IP limit is shared through Redis. Groq and Redis have their own plans and usage limits. Vercel Hobby is free for personal, non-commercial projects; commercial use requires a suitable paid plan. See [Vercel FastAPI deployment](https://vercel.com/docs/frameworks/backend/fastapi), [function limits](https://vercel.com/docs/functions/limitations), and [Hobby plan terms](https://vercel.com/docs/plans/hobby).

Keep `backend/uv.lock` and `frontend/package-lock.json` committed for reproducible installs. Do not commit `.env` files or uploaded resumes.

PDFs must contain selectable text; scanned image-only PDFs need OCR before they can be analyzed.
