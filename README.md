# Sai Nithin Reddy — Portfolio

**Computer Science & Engineering · AI & Full-Stack Development · Systems Building**

Personal portfolio of Sai Nithin Reddy, a third-year Computer Science & Engineering student at Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad. The site presents selected projects, technical skills, education, achievements, and engineering work.

## Highlights

- Project showcases and case studies
- Responsive React and TypeScript frontend
- Express backend and Netlify Functions for supported API workflows
- Optional GitHub project synchronization
- Admin content-management workflow with server-side authentication
- Resume and profile asset handling
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
| Serverless | Netlify Functions |
| Data | JSON portfolio store, Netlify Database / Drizzle integration |
| Integrations | GitHub API; optional Supabase Storage and Gemini |
| Testing | Node.js test runner, TypeScript checks |

Optional integrations are configuration-dependent. The application supports an Express runtime and a Netlify Functions deployment path; verify the selected hosting environment supports the backend features you enable.

## Repository Structure

```text
Portfolio/
├── data/                  # Portfolio content and assets
├── db/                    # Database client and schema
├── netlify/functions/     # Serverless API endpoints
├── public/                # Static assets and sitemap
├── server/                # Backend services
├── src/
│   ├── components/        # Reusable UI components
│   ├── content/           # Curated portfolio content and types
│   ├── pages/             # Application pages
│   ├── services/          # API and synchronization logic
│   └── utils/             # Shared utilities
├── tests/                 # API and persistence tests
├── server.ts              # Express application entry point
├── netlify.toml           # Netlify build and routing configuration
└── package.json           # Scripts and dependencies
```

## Local Development

### Prerequisites

- Node.js 22.12 or later (Node 22 LTS recommended)
- npm

### Setup

```bash
git clone https://github.com/sainithinreddy06/Portfolio.git
cd Portfolio
npm install
```

Create your local environment file:

**PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

Set only the variables needed for the services you enable. Start the development server:

```bash
npm run dev
```

### Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Express/Vite development server |
| `npm run build` | Build the frontend into `dist/` |
| `npm run preview` | Preview the Vite production build |
| `npm run lint` | Run the TypeScript compiler check |
| `npm test` | Run the Node.js test suite |
| `npm start` | Start the Express server in production mode |

## Environment Variables

See [`.env.example`](./.env.example) for supported configuration names. Admin credentials, signing secrets, API tokens, and database connection strings must remain server-side.

- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`: admin authentication.
- `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`: optional GitHub API and webhook integration.
- `NETLIFY_DB_URL` or `DATABASE_URL`: optional database connection.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY`, `SUPABASE_STORAGE_BUCKET`: optional asset storage.
- `GEMINI_API_KEY`: optional Gemini integration.
- `PORT`, `NODE_ENV`: local/server runtime configuration.

Never commit a populated `.env` file. Use strong unique secrets and rotate any credential that may have been exposed.

## Deployment

The repository includes `netlify.toml` for a Netlify build:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Configure required environment variables in the hosting provider dashboard. After deployment, verify the homepage, case-study routes, admin authentication, API endpoints, resume delivery, and any enabled integrations.

## Contact

- **GitHub:** [@sainithinreddy06](https://github.com/sainithinreddy06)
- **LinkedIn:** [Sai Nithin Reddy](https://www.linkedin.com/in/sai-nithin-reddy-tadugam-906825372)
- **Email:** [sainithinreddytadugam@gmail.com](mailto:sainithinreddytadugam@gmail.com)

---

*Designed, developed, and maintained by Sai Nithin Reddy.*
