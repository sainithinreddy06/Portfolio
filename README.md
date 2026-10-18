# Sai Nithin Reddy — Personal Portfolio

**AI Engineer · Full-Stack Developer · Systems Builder**

Welcome to my portfolio repository! I'm Sai Nithin Reddy, a Computer Science and Engineering student interested in building useful software, exploring AI, and solving real-world problems through technology.

This portfolio is where I bring my work together — from projects and technical experiments to my experience, skills, and engineering journey. I built it to share what I'm working on, what I've learned, and how I approach software development.

## About the Project

My portfolio is more than a collection of project links. It's a responsive personal website designed to present my work, technical background, and experience in one place.

Along with the frontend, the project includes backend services and serverless functions for managing portfolio content, synchronizing GitHub projects, handling resume and profile assets, and supporting an optional admin workflow.

## Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI and Animations | Tailwind CSS, Lucide React, Motion |
| Backend | Node.js, Express, TypeScript |
| Serverless Functions | Netlify Functions |
| GitHub Integration | GitHub API |
| Data Storage | JSON-based portfolio store |
| Cloud Asset Storage | Optional Supabase Storage integration |
| AI Integration | Optional Google Gemini integration |
| Deployment | Netlify |
| Development Tools | Git, GitHub, npm / Bun |

*The stack above reflects the project's intended integrations. Optional services require configuration, and not every integration is enabled by default.*

## What It Includes

- **Personal portfolio:** An overview of my background, technical skills, experience, and education.
- **Project showcase:** Selected projects with supporting details and case studies.
- **Resume section:** Access to my resume through the portfolio interface.
- **GitHub synchronization:** Functionality for discovering and synchronizing project information from GitHub.
- **Content management:** Supporting services for managing portfolio data and uploaded assets.
- **Admin workflow:** An optional interface for managing supported portfolio content.
- **Responsive design:** A layout designed to work across desktop, tablet, and mobile screens.
- **Deployment support:** Configuration for hosting the frontend and serverless functions on Netlify.

## How the Project Works

The frontend presents the portfolio and handles user interaction. Depending on the deployment setup, API requests can be handled by the Express server or by Netlify Functions.

These backend components support portfolio content, project synchronization, and asset-related workflows. Optional integrations can extend the application with AI-assisted extraction and cloud asset storage.

```text
                    Visitor
                       |
                       v
             React + TypeScript UI
                       |
                       v
                   API Layer
                  /         \
                 v           v
          Express Server   Netlify Functions
                 \           /
                  \         /
                   v       v
              Portfolio Services
                       |
          +------------+------------+
          |            |            |
          v            v            v
      JSON Store   GitHub API   Asset Storage
                                (optional)
```

The Express server and Netlify Functions are separate execution paths, so their supported features and configuration should be verified for the chosen hosting environment.

## Project Structure

```text
Portfolio/
├── data/                  # Portfolio content and assets
├── netlify/
│   └── functions/         # Serverless API endpoints
├── public/
│   └── images/            # Public static images
├── server/                # Backend services and integrations
├── src/
│   ├── components/        # Reusable UI components
│   ├── content/           # Portfolio content and types
│   ├── pages/             # Application pages
│   ├── services/          # Project sync and application logic
│   └── utils/             # Utility functions
├── server.ts              # Express application entry point
├── index.html             # Application HTML entry
├── netlify.toml           # Netlify configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── .env.example           # Environment variable template
```

## Getting Started

Want to run the project locally? Follow these steps.

### Prerequisites

- Node.js compatible with the project's dependencies
- npm or Bun

### 1. Clone the repository

```bash
git clone https://github.com/sainithinreddy06/Portfolio.git
cd Portfolio
```

### 2. Install dependencies

Using npm:

```bash
npm install
```

Or, if you prefer Bun:

```bash
bun install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and configure the settings required for the features you want to use.

For example, in PowerShell:

```powershell
Copy-Item .env.example .env
```

Set secure values for any enabled admin authentication features. Optional integrations such as GitHub API access, Gemini, and Supabase require their respective configuration.

**Keep your `.env` file private. Never commit API keys, passwords, session secrets, or service-role credentials to GitHub.**

### 4. Start the development server

```bash
npm run dev
```

Vite will display the local URL in your terminal.

### 5. Build for production

```bash
npm run build
```

To start the Express server, if supported by the configured package scripts:

```bash
npm run start
```

Check `package.json` for the available scripts and their exact behavior.

## Deployment

The repository includes a `netlify.toml` file for configuring the production build, published directory, serverless functions, and redirects.

To deploy through Netlify:

1. Import this GitHub repository into Netlify.
2. Configure the build command as `npm run build`.
3. Set the publish directory to `dist`.
4. Add the environment variables required by the enabled features.
5. Deploy the site and test the pages, API endpoints, resume access, and any integrations you use.

If automatic deployments are enabled, pushing new commits to the configured GitHub branch can trigger a new deployment.

Before deploying, verify that the selected hosting environment supports the backend features you intend to use.

## Environment Configuration

The `.env.example` file contains the project's environment-variable template. Depending on your setup, you may encounter settings such as:

| Variable | Purpose |
|---|---|
| `GITHUB_USERNAME` | GitHub account used for project synchronization |
| `GITHUB_TOKEN` | Optional GitHub API authentication |
| `GEMINI_API_KEY` | Optional Gemini integration |
| `ADMIN_EMAIL` | Admin account configuration |
| `ADMIN_PASSWORD` | Admin authentication |
| `SESSION_SECRET` | Session security |
| `APP_URL` | Application URL |
| `PORT` | Express server port |
| `NODE_ENV` | Runtime environment |
| `SUPABASE_URL` | Optional Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional server-side Supabase credential |
| `SUPABASE_STORAGE_BUCKET` | Optional asset storage bucket |

Refer to `.env.example` and the implementation for the actual requirements. You do not need to configure every optional integration to work on the frontend.

### Deployment secrets scanning

Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the hosting environment, never in
committed environment files or client-side build variables. Admin login requires
both settings and accepts only the configured email address.

The portfolio intentionally publishes its contact email. Because that public
address may also be the admin login identifier, Netlify excludes only
`ADMIN_EMAIL` from secrets scanning. Passwords and all other secrets remain
covered. If a password was exposed in a previous deployment or commit, replace
it in Netlify before deploying again; removing it from current files does not
revoke the old credential.

## A Few Engineering Priorities

While developing this project, I focus on:

- Keeping the interface clean, responsive, and easy to navigate.
- Organizing the code into reusable components and understandable modules.
- Connecting frontend features to appropriate backend services.
- Integrating external services without making optional dependencies mandatory.
- Handling authentication and configuration carefully.
- Making the project easier to run, maintain, and deploy.

## Future Improvements

The portfolio will continue to evolve as I build new projects and improve my engineering skills. Areas I may explore include better testing, stronger observability, improved content management, and further refinements to accessibility and performance.

## Connect With Me

I'm always happy to connect with fellow developers, learn from other engineers, and explore interesting opportunities.

- **GitHub:** [@sainithinreddy06](https://github.com/sainithinreddy06)
- **LinkedIn:** [Sai Nithin Reddy](https://www.linkedin.com/in/sai-nithin-reddy-tadugam-906825372)
- **Email:** [sainithinreddytadugam@gmail.com](mailto:sainithinreddytadugam@gmail.com)

---

*Designed, developed, and maintained by Sai Nithin Reddy.*
