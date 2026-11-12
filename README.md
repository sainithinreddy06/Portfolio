# Sai Nithin Reddy — Portfolio

**Computer Science & Engineering · AI & Full-Stack Development · Systems Building**

Personal portfolio of Sai Nithin Reddy, a third-year Computer Science & Engineering student at Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad.

## Highlights

- Responsive React and TypeScript portfolio
- Express and Node.js backend served by the same application
- Curated project showcases and case studies
- Optional GitHub project synchronization and webhook support
- Admin content-management workflow with server-side authentication
- Resume and profile asset management
- Two college-level nominations for Smart India Hackathon (SIH)

## Selected Work

- **PRAVAAH** — AICTE approval workflow automation, compliance monitoring, obligation tracking, and auditable alert management.
- **TAPAS** — Geospatial heat-safety analytics and public-health advisory platform.
- **SureStep** — AI-assisted outdoor safety and terrain-risk navigation.
- **TRAFFIQ** — Traffic congestion and accident-risk prediction.
- **VidyaVistaar** — AI-powered educational learning platform.

## Technology

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI | Tailwind CSS, Lucide React, Motion |
| Backend | Node.js, Express, TypeScript |
| Data | Versioned JSON portfolio store |
| Integrations | GitHub API; optional Supabase Storage and Gemini |
| Testing | Node.js test runner, TypeScript checks |

## Repository Structure

```text
Portfolio/
├── data/                  # Portfolio content and assets
├── public/                # Static assets and sitemap
├── server/                # Express backend services
├── src/                   # React application, pages and components
├── tests/                 # API and persistence tests
├── server.ts              # Express application and API routes
└── package.json           # Scripts and dependencies
```

## Local Development

Requirements: Node.js 22.12+ (Node 22 LTS recommended) and npm.

```bash
git clone https://github.com/sainithinreddy06/Portfolio.git
cd Portfolio
npm install
cp .env.example .env
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Express/Vite development server |
| `npm run build` | Build the frontend into `dist/` |
| `npm run preview` | Preview the Vite production build |
| `npm run lint` | Run the TypeScript compiler check |
| `npm test` | Run the API and persistence tests |
| `npm start` | Start the production Express server |

## Environment

See [`.env.example`](./.env.example). Configure only integrations you use:

- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`: admin authentication.
- `GITHUB_USERNAME`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`: GitHub API and webhook integration.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY`, `SUPABASE_STORAGE_BUCKET`: optional asset storage.
- `GEMINI_API_KEY`: optional resume parsing.
- `PORT`, `NODE_ENV`, `APP_URL`, `ALLOWED_ORIGINS`: runtime and origin configuration.

Never commit populated environment files. Keep credentials in the hosting provider's environment settings.

## Render Deployment

Run the portfolio as **one full-stack Node.js web service**; Express serves both the built React frontend and API.

- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check: `/api/health`

The portfolio's durable state is stored in the Supabase `portfolio_state` table and uploaded profile assets use the public `portfolio-assets` Storage bucket. Configure `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` in Render before relying on admin edits and uploads. The service-role key must never be exposed in frontend variables or committed to Git. Local JSON files are only a fallback/cache on Render's ephemeral filesystem.

## Contact

- **GitHub:** [@sainithinreddy06](https://github.com/sainithinreddy06)
- **LinkedIn:** [Sai Nithin Reddy](https://www.linkedin.com/in/sai-nithin-reddy-tadugam-906825372)
- **Email:** [sainithinreddytadugam@gmail.com](mailto:sainithinreddytadugam@gmail.com)
