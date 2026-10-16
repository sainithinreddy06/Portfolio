<div align="center">

# Sai Nithin Reddy

**AI Engineer · Full-Stack Developer · Systems Builder**

Building practical software with thoughtful engineering, AI, and modern web technologies.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-typed%20JavaScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-build%20tool-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API%20server-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Netlify](https://img.shields.io/badge/Netlify-deployment-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)

</div>

---

## About the Portfolio

This repository contains my personal engineering portfolio: a responsive website presenting my background, technical skills, selected projects, case studies, experience, education, and resume.

The project also includes server-side functionality for portfolio content, GitHub project synchronization, resume and profile-asset management, and an optional admin workflow.

## Technology Stack

| Domain | Technologies and responsibilities |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, React Router |
| **UI and motion** | Lucide React icons, Motion animations, custom responsive components |
| **Backend** | Node.js, Express, TypeScript |
| **Serverless APIs** | Netlify Functions for portfolio content, projects, resume, status, synchronization, and webhook endpoints |
| **GitHub integration** | Repository discovery and synchronization through the GitHub API; optional personal access token for higher rate limits |
| **AI integration** | Optional server-side Google Gemini integration for supported resume/README extraction workflows |
| **Data persistence** | JSON file-backed portfolio store and local asset management in the server implementation |
| **Optional cloud storage** | Supabase Storage integration for uploaded assets when configured; repository-based static asset fallback |
| **Build and deployment** | Vite production build, Netlify redirects and Functions configuration |
| **Security** | Environment-based configuration, admin authentication, session handling, login rate limiting, and GitHub webhook signature verification |

> **Database note:** The current implementation uses a JSON file-backed store by default. Supabase is an optional asset-storage integration; this project should not be described as using a SQL or NoSQL database unless a database is separately configured and implemented.

## Architecture at a Glance

```text
Visitor
  |
  v
React + TypeScript frontend
  |
  +---- Portfolio pages, case studies, resume, project showcase
  |
  v
API layer
  |
  +---- Express server (local / Node hosting)
  |
  +---- Netlify Functions (Netlify deployment)
          |
          +---- Portfolio JSON store and asset management
          +---- GitHub repository synchronization
          +---- Optional Gemini-powered extraction
          +---- Optional Supabase Storage
```

## Repository Structure

```text
.
├── src/
│   ├── components/       # Shared UI, layout, admin, and page sections
│   ├── content/          # Portfolio content and content types
│   ├── pages/            # Home, case study, admin, and not-found pages
│   ├── services/         # Project synchronization and pipeline logic
│   └── utils/            # Resume and supporting utilities
├── server/               # Express-side services, authentication, storage, GitHub
├── netlify/functions/    # Serverless API handlers
├── data/                 # Portfolio content and uploaded/static assets
├── public/                # Public static assets
├── server.ts              # Express application entry point
├── netlify.toml           # Build, function, and redirect configuration
├── package.json           # Scripts and dependencies
└── .env.example           # Environment-variable template
```

## Run Locally

### Prerequisites

- Node.js compatible with the installed Vite version
- npm (or Bun, if you prefer the included lockfile's package manager)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and set the values required for the features you intend to use.

At minimum, configure a strong admin password and a unique session secret before enabling the admin workflow. GitHub, Gemini, Netlify, and Supabase integrations are optional and require their respective credentials only when those features are needed.

**Never commit a real `.env` file, access tokens, service-role keys, passwords, or session secrets.**

### 3. Start the development server

```bash
npm run dev
```

### 4. Create a production build

```bash
npm run build
```

To run the server in production mode after building:

```bash
npm run start
```

Available scripts can be checked in `package.json`.

## Deployment

### Netlify

The repository includes `netlify.toml`, which defines the build command, published `dist` directory, serverless functions directory, API redirects, and SPA fallback.

1. Import the repository into Netlify.
2. Set the build command to `npm run build`.
3. Set the publish directory to `dist`.
4. Configure only the environment variables needed by enabled features.
5. Deploy and test the portfolio pages and API routes.

The Express server and Netlify Functions are separate execution paths. Verify the endpoints required by your chosen deployment target before relying on server-specific features.

## Environment Variables

See [`.env.example`](.env.example) for the full template. Common settings include:

- `GITHUB_USERNAME` — GitHub account used for repository synchronization.
- `GITHUB_TOKEN` — optional GitHub API token.
- `GEMINI_API_KEY` — optional Gemini integration.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` — admin authentication configuration.
- `APP_URL`, `PORT`, `NODE_ENV` — application and server configuration.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` — optional asset storage.

Use real credentials only in your local environment or hosting provider's secret settings.

## Engineering Focus

- Responsive portfolio UI and reusable React components
- Type-safe application development with TypeScript
- REST-style API routes and serverless function integration
- GitHub API integration and repository synchronization
- File-backed content persistence and asset handling
- Optional AI and cloud-storage integrations
- Authentication, rate limiting, webhook verification, and deployment configuration

## Notes

- Portfolio copy, project details, resume, photos, and existing visual design are maintained from the supplied project.
- Optional integrations remain optional; configure their credentials before using them.
- Do not publish local session files, real credentials, or private tokens to a public repository.
- Test the build and deployment configuration in your environment before release.

---

<div align="center">

Made by **Sai Nithin Reddy**

</div>
