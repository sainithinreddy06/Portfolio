import { PortfolioContent } from './types';

export const initialPortfolioContent: PortfolioContent = {
  profile: {
    name: 'Sai Nithin Reddy',
    wordmark: 'SAI NITHIN REDDY',
    positioning: 'PRODUCTION-FULLSTACK ENGINEER · REACT & NODE · CLOUD INFRASTRUCTURE',
    headline: 'I build production-grade full-stack systems with React, Node, and cloud infrastructure',
    institution: 'Chaitanya Bharathi Institute of Technology (CBIT)',
    degree: 'Computer Science & Engineering',
    batchPeriod: '2024 – 2028',
    currentYear: 'Third Year',
    cgpa: 8.96,
    email: 'sainithinreddytadugam@gmail.com',
    githubUrl: 'https://github.com/sainithinreddy06',
    linkedinUrl: 'https://www.linkedin.com/in/sai-nithin-reddy-tadugam-906825372',
    leetcodeUrl: 'https://leetcode.com/u/Nithinreddy_06/',
    leetcodeUsername: 'Nithinreddy_06',
    aboutText: [
      'I build production-grade full-stack systems with React, Node, and cloud infrastructure, delivering end-to-end architectures from data ingestion pipelines and mathematical modeling to reactive client interfaces and geospatial visualizations.',
      'My work focuses on production-grade architectures where latency, correctness, and reliable data flow matter — including intelligent navigation, environmental sensing, and predictive systems deployed at scale.',
      'I bridge the gap between research prototypes and production systems, ensuring engineering rigor, scalable design, and measurable outcomes across the full stack.',
    ],
    currentLearningDirection:
      'Deepening systems programming, distributed backend architectures, and production-grade ML inference optimization.',
    learningDirectionVerifyNote: undefined,
    photo: {
      url: '/images/profile-photo.png',
      altText: 'Portrait of Sai Nithin Reddy, Computer Science & Engineering student at Chaitanya Bharathi Institute of Technology (CBIT)',
      showInHero: true,
      showInAbout: false,
      isPlaceholder: false,
    },
    resume: {
      fileUrl: '/resume.pdf',
      fileName: 'Sai_Nithin_Reddy_Resume.pdf',
      fileSize: '137 KB',
      uploadedAt: 'Oct 16, 2026',
      isAvailable: true,
      comingSoonMessage: 'Resume document is currently unavailable.',
    },
  },
  projects: [
    {
      id: 'pravaah',
      source: 'curated',
      isManualOverride: true,
      name: 'PRAVAAH',
      tagline: 'AICTE Approval Workflow Automation, Compliance Monitoring & Alert Management',
      category: 'AI / FULL STACK',
      stack: ['React', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'Supabase'],
      description: 'A role-based approval workflow prototype for institutional applications, combining evidence uploads and review, versioned policy metadata, obligation tracking, readiness assessments, in-app notifications, and verifiable hash-chain audit history.',
      summary: 'Enterprise approval workflow and compliance platform combining policy lifecycle management, deterministic proof generation, obligation tracking, alert orchestration, and hash-chain auditability.',
      status: 'Prototype',
      features: [
        { name: 'Policy Version Pinning & Migration Simulation', status: 'Prototype' },
        { name: 'Deterministic Compliance Proof Engine', status: 'Prototype' },
        { name: 'Concurrent Obligation Ledger', status: 'Prototype' },
        { name: 'Transactional Outbox & Alert Processing', status: 'Prototype' },
        { name: 'Tamper-Evident Hash-Chain Audit Trail', status: 'Prototype' },
      ],
      githubUrl: 'https://github.com/sainithinreddy06/PRAVAAH',
      liveUrl: 'https://pravaah-frontend-bx3o.onrender.com',
      caseStudySlug: 'pravaah',
      hasArchitecture: true,
      featured: true,
      order: 0,
      architectureFlow: {
        title: 'PRAVAAH Workflow Architecture',
        summary: 'Policy-aware approval workflow connecting institutional submissions, deterministic compliance evaluation, obligation tracking, alert delivery, and auditable records.',
        nodes: [
          { id: '1', label: 'Institution Portal', sublabel: 'Submission & Workflow UI', status: 'Prototype' },
          { id: '2', label: 'Policy Registry', sublabel: 'Version Pinning & Migration', status: 'Prototype' },
          { id: '3', label: 'Proof Engine', sublabel: 'Deterministic Compliance Checks', status: 'Prototype' },
          { id: '4', label: 'Obligation Ledger', sublabel: 'Concurrent Tracking', status: 'Prototype' },
          { id: '5', label: 'Outbox & Audit', sublabel: 'Alerts and Hash-Chain Records', status: 'Prototype' },
        ],
      },
    },
    {
      id: 'tapas',
      source: 'curated',
      isManualOverride: true,
      name: 'TAPAS',
      tagline: 'Thermal Analytics & Public-health Advisory System',
      category: 'FULL STACK',
      stack: ['Next.js 15', 'React 19', 'TypeScript', 'MapLibre GL', 'D3 Contour', 'Recharts', 'Tailwind CSS'],
      description: 'A geospatial heat-safety application that maps weather-driven heat-index conditions with thermal contours, location-aware forecasts, nearby mapped services, and sourced public-health guidance, while clearly marking unavailable scientific data.',
      summary:
        'Public heat-safety platform combining MapLibre GL geospatial mapping with meteorological analysis, thermal contour rendering, and dynamic reference health advisory workflows.',
      status: 'Prototype',
      features: [
        { name: 'MapLibre Geospatial Mapping & Emergency Help GIS', status: 'Prototype' },
        { name: 'D3 Contour Thermal Risk Modeling', status: 'Prototype' },
        { name: 'Public Weather Telemetry & Heat Advisory Engine', status: 'Prototype' },
        { name: 'Next.js 15 & React 19 Client Architecture', status: 'Prototype' },
        { name: 'Public Health Guidance & Heat-Safety Protocol Alignment', status: 'Prototype' },
        { name: 'Dynamic Recharts Heat Trend Visualizer', status: 'Prototype' },
      ],
      githubUrl: 'https://github.com/sainithinreddy06/TAPAS',
      liveUrl: 'https://tapas-g0ly.onrender.com',
      caseStudySlug: 'tapas',
      hasArchitecture: true,
      featured: true,
      order: 1,
      architectureFlow: {
        title: 'TAPAS Architecture Flow',
        summary:
          'Geospatial heat-safety pipeline routing public weather inputs and coordinates through thermal contour modeling to MapLibre GIS layers.',
        nodes: [
          { id: '1', label: 'User Client', sublabel: 'Next.js 15 & React 19 UI', status: 'Prototype' },
          { id: '2', label: 'Place Discovery', sublabel: 'Geocoding & Telemetry', status: 'Prototype' },
          { id: '3', label: 'Thermal Modeling', sublabel: 'D3 Contour Engine', status: 'Prototype' },
          { id: '4', label: 'MapLibre GIS', sublabel: 'Vector Heat Shelters & Maps', status: 'Prototype' },
          { id: '5', label: 'Health Advisories', sublabel: 'SIH Reference Protocols', status: 'Prototype' },
        ],
      },
    },
    {
      id: 'surestep',
      source: 'curated',
      isManualOverride: true,
      name: 'SureStep',
      tagline: 'AI-Powered Outdoor Safety & Navigation Platform — 48-Hour Hackathon Prototype',
      category: 'LEARNING EXPERIMENTS',
      stack: ['React', 'TypeScript', 'Node.js', 'Python', 'FastAPI', 'PyTorch', 'Ultralytics YOLO', 'Scikit-learn', 'OpenCV', 'GPS Telemetry'],
      description: 'A hiking-safety application combining YOLO-based visual hazard detection, Random Forest terrain-risk scoring, GPS route tracking, weather context, geological alerts, hazard reporting, and an AI Ranger copilot. Built as a 48-hour hackathon prototype (8 commits) — not a production system.',
      summary:
        '48-hour hackathon prototype exploring multi-modal outdoor navigation and hazard assessment with Ultralytics YOLO computer vision and Random Forest terrain risk modeling. GitHub history: 8 commits. Not production-ready.',
      status: 'Prototype',
      features: [
        { name: 'AI Terrain Risk Prediction (Random Forest)', status: 'Prototype' },
        { name: 'SureStep Vision (YOLO Object Detection)', status: 'Prototype' },
        { name: 'Tactical GPS Navigation & Route Scoring', status: 'Prototype' },
        { name: 'AI Ranger Contextual Safety Copilot', status: 'Prototype' },
        { name: 'Geological Hazard & USGS Seismic Monitoring', status: 'Prototype' },
        { name: 'Offline Map Layer Caching', status: 'Planned' },
      ],
      githubUrl: 'https://github.com/sainithinreddy06/SureStep',
      caseStudySlug: 'surestep',
      hasArchitecture: true,
      architectureFlow: {
        title: 'SureStep Pipeline Flow',
        summary:
          'Sensor processing and navigation pipeline from client to intelligent safety services. (Hackathon prototype — 8 commits)',
        nodes: [
          { id: '1', label: 'Client Application', sublabel: 'React & TypeScript UI', status: 'Prototype' },
          { id: '2', label: 'Location & GPS', sublabel: 'Telemetry Engine', status: 'Prototype' },
          { id: '3', label: 'FastAPI & Node Service', sublabel: 'Full-Stack ML Pipeline', status: 'Prototype' },
          { id: '4', label: 'Random Forest Model', sublabel: 'Terrain Risk Scoring', status: 'Prototype' },
          { id: '5', label: 'AI Ranger Copilot', sublabel: 'Contextual Safety Assistance', status: 'Prototype' },
          { id: '6', label: 'Offline / Cloud Sync', sublabel: 'Trail Map Layers', status: 'Planned' },
        ],
      },
    },
    {
      id: 'traffiq',
      name: 'TRAFFIQ',
      tagline: 'AI Traffic & Accident Risk Prediction — 48-Hour Hackathon Prototype',
      category: 'LEARNING EXPERIMENTS',
      stack: [
        'React',
        'FastAPI',
        'Python',
        'MongoDB',
        'Scikit-learn',
        'Tailwind CSS',
        'Geospatial APIs',
      ],
      description: 'A traffic-intelligence dashboard for exploring road and environmental data, with FastAPI and MongoDB services, interactive maps, congestion and accident-risk prototypes, spatial heatmaps, and historical trend views. Built as a 48-hour hackathon prototype (2 commits) — not a production system.',
      summary:
        '48-hour hackathon prototype exploring ML-based traffic prediction with FastAPI and MongoDB. GitHub history: 2 commits. Not production-ready.',
      status: 'Prototype',
      features: [
        { name: 'Congestion Prediction Engine', status: 'Prototype' },
        { name: 'Accident-Risk Spatial Classification', status: 'Prototype' },
        { name: 'Dynamic Risk Heatmaps & Analytics', status: 'Prototype' },
        { name: 'Interactive Map GIS Dashboard', status: 'Prototype' },
        { name: 'FastAPI Async REST APIs & MongoDB Storage', status: 'Implemented' },
        { name: 'Time-Series Trend Forecasting', status: 'Planned' },
        { name: 'Meteorological Weather Data Ingestion', status: 'Planned' },
      ],
      githubUrl: 'https://github.com/sainithinreddy06/TRAFFIQ',
      caseStudySlug: 'traffiq',
      hasArchitecture: true,
      architectureFlow: {
        title: 'TRAFFIQ System Flow',
        summary:
          'High-level intended flow from geospatial telemetry to prediction models and reactive mapping. (Hackathon prototype — 2 commits)',
        nodes: [
          { id: '1', label: 'Frontend Client', sublabel: 'React & Mapping UI', status: 'Implemented' },
          { id: '2', label: 'FastAPI Backend', sublabel: 'Async REST Service', status: 'Implemented' },
          { id: '3', label: 'Data Processing', sublabel: 'Feature Extraction & Windows', status: 'Implemented' },
          { id: '4', label: 'ML Models', sublabel: 'Scikit-learn Risk Classifier', status: 'Prototype' },
          { id: '5', label: 'MongoDB', sublabel: 'Spatial Telemetry Collection', status: 'Implemented' },
          { id: '6', label: 'Geospatial APIs', sublabel: 'External Tile & Routing', status: 'Planned' },
        ],
      },
    },
    {
      id: 'vidyavistaar',
      name: 'VidyaVistaar',
      tagline: 'AI-Powered Educational Learning Platform — Hackathon Prototype',
      category: 'LEARNING EXPERIMENTS',
      stack: ['React 19', 'TypeScript', 'Google Gemini AI', 'Recharts', 'Vite', 'Tailwind CSS'],
      description:
        'A modern AI-powered educational intelligence platform designed to deliver personalized student tutoring and adaptive learning workflows. Connects a type-safe React 19 frontend with Google Gemini AI generative models for contextual multi-turn Q&A, backed by dynamic Recharts visual analytics tracking student concept mastery and engagement curves over time. Built as a hackathon prototype (4 commits) — not a production system.',
      summary:
        'Hackathon prototype exploring Google Gemini AI integration with React 19 and Recharts for educational Q&A. GitHub history: 4 commits. Not production-ready.',
      status: 'Prototype',
      features: [
        { name: 'Intelligent AI Question Answering', status: 'Prototype' },
        { name: 'Google Gemini GenAI Integration', status: 'Prototype' },
        { name: 'Interactive Performance Visualizations (Recharts)', status: 'Prototype' },
        { name: 'Modular Type-Safe React 19 Architecture', status: 'Prototype' },
        { name: 'Student Analytics & Activity Tracking', status: 'Prototype' },
        { name: 'Personalized Learning Workflows', status: 'Planned' },
      ],
      githubUrl: 'https://github.com/sainithinreddy06/VidyaVistaar',
      caseStudySlug: 'vidyavistaar',
      hasArchitecture: true,
      architectureFlow: {
        title: 'VidyaVistaar Architecture Flow',
        summary:
          'Modular component-based frontend architecture routing student queries to Google Gemini AI and Recharts visual analytics. (Hackathon prototype — 4 commits)',
        nodes: [
          { id: '1', label: 'User Client', sublabel: 'React & Responsive UI', status: 'Prototype' },
          { id: '2', label: 'Component Layer', sublabel: 'Interactive UI Elements', status: 'Prototype' },
          { id: '3', label: 'Services Layer', sublabel: 'Google GenAI SDK Integration', status: 'Prototype' },
          { id: '4', label: 'Gemini AI Engine', sublabel: 'Educational Intelligence & Q&A', status: 'Prototype' },
          { id: '5', label: 'Recharts Visualizer', sublabel: 'Learning Progress & Analytics', status: 'Prototype' },
        ],
      },
    },
  ],
  caseStudies: {
    pravaah: {
      slug: 'pravaah',
      title: 'PRAVAAH',
      subtitle: 'Enterprise Autonomous Transformation — Policy-Aware Approval & Compliance Platform',
      overview:
        'PRAVAAH is an academic prototype for AICTE-oriented approval workflow automation and compliance operations. It brings role-based institutional workspaces, policy version pinning, policy migration simulation, deterministic compliance proofs, evidence reviews, a concurrent obligation ledger, transactional alert processing, and a tamper-evident audit trail into one platform. It supports structured human review; it is not an official AICTE service and does not issue regulatory approvals.',
      problem:
        'Approval and compliance work can span multiple stakeholders, policy requirements, supporting documents, review stages, deadlines, and follow-up actions. When these activities are distributed across separate records and communication channels, teams can struggle to identify missing evidence, understand application status, and maintain a traceable history.',
      whyBuilt:
        'The project explores how policy-aware workflow software can make institutional reviews more consistent and auditable. Its design connects versioned policy context to deterministic checks, evidence-backed application records, obligation tracking, reliable alert processing, and verifiable audit events while keeping final decisions with authorised human reviewers.',
      architectureSummary:
        'The React, TypeScript, and Vite frontend communicates with a Python FastAPI backend over HTTP APIs. The backend separates policy lifecycle, application workflow, deterministic compliance evaluation, evidence handling, obligation management, notification delivery, and audit services. SQLAlchemy provides data access to PostgreSQL, while Alembic manages schema migrations. A transactional outbox pattern is used to coordinate durable event recording with asynchronous alert processing; hash-chain verification provides an application-level audit-integrity check.',
      architectureFlow: [
        { id: '1', label: 'Role-based Workspace', sublabel: 'React, TypeScript & Vite', status: 'Implemented' },
        { id: '2', label: 'API & Access Layer', sublabel: 'FastAPI Authentication & Scoped Authorisation', status: 'Implemented' },
        { id: '3', label: 'Policy Registry', sublabel: 'Version Pinning & Migration Simulation', status: 'Prototype' },
        { id: '4', label: 'Deterministic Proof Engine', sublabel: 'Policy-Driven Evidence & Compliance Checks', status: 'Prototype' },
        { id: '5', label: 'Obligation Ledger', sublabel: 'Concurrent Tracking & Undertakings', status: 'Prototype' },
        { id: '6', label: 'Transactional Outbox', sublabel: 'Reliable Alert & Event Processing', status: 'Prototype' },
        { id: '7', label: 'Audit & Persistence', sublabel: 'PostgreSQL, SQLAlchemy & Hash-Chain Verification', status: 'Implemented' },
      ],
      dataPipeline:
        'An application record moves through authenticated workflow transitions and is evaluated against its pinned policy version. Evidence metadata and file digests are associated with the record; the deterministic proof layer evaluates configured requirements and produces explainable results for review. Policy migration simulation compares the impact of a proposed policy version before adoption. Obligations and undertakings are tracked in a shared ledger, while transactional outbox events are processed for dependable in-app alerts. Readiness snapshots bring evidence state, open obligations, and unaccepted undertakings together for human assessment.',
      frontendNotes:
        'The React, TypeScript, and Vite client presents role-oriented workspaces for submitting, reviewing, administering, and monitoring workflow records. The interface consumes backend APIs rather than treating client-side state as the source of truth for workflow decisions.',
      backendNotes:
        'FastAPI exposes application, policy, evidence, compliance, and administrative workflows. Authentication and role/region-scoped authorisation protect supported operations. Services cover application transitions, policy version pinning and migration simulation, deterministic proof evaluation, evidence review, concurrent obligation tracking, undertakings, readiness snapshots, rule-based recommendations, transactional outbox processing, in-app notifications, operational metrics, and audit verification.',
      databaseNotes:
        'SQLAlchemy provides the data-access layer and Alembic manages schema migrations. PostgreSQL is the intended deployment database, while selected tests may use SQLite. Relational records hold workflow, policy, obligation, event, and audit metadata; evidence files use configured storage paths. The outbox and audit chain are application-level reliability and integrity mechanisms, not a claim of independently immutable infrastructure.',
      technicalDecisions: [
        {
          decision: 'Separate the client interface from workflow enforcement',
          rationale: 'Keeping workflow operations behind FastAPI endpoints allows authentication, authorisation, validation, policy-version checks, and business rules to be applied at the service boundary.',
        },
        {
          decision: 'Use role- and region-scoped authorisation',
          rationale: 'Different participants need different operational views, and access should be constrained by role and applicable regional scope rather than relying on UI visibility alone.',
        },
        {
          decision: 'Represent readiness as a point-in-time snapshot',
          rationale: 'Pinning the applicable policy version makes later reviews reproducible, while migration simulation helps assess policy changes before they affect active workflows.',
        },
        {
          decision: 'Use a transactional outbox and explicit audit-integrity checks',
          rationale: 'The outbox separates committed workflow changes from asynchronous notification processing, reducing the risk of losing an alert between a database update and event delivery. The administrator verification workflow checks event hashes and links and compares the calculated chain head with the stored chain head; this provides an application-level integrity signal, not independently immutable storage.',
        },
      ],
      challenges: [
        'Keeping policy versions, evidence decisions, obligation state, asynchronous alert events, and audit history consistent across related workflow operations.',
        'Applying role- and region-scoped access consistently across workflow operations.',
        'Communicating the boundary between rule-based readiness guidance and decisions that must remain with authorised human reviewers.',
        'Making audit-chain verification understandable while accurately describing its application-level trust boundary.',
      ],
      lessons: [
        'Compliance software needs explainable workflow state and traceable evidence, not only a collection of forms and dashboards.',
        'Readiness summaries should support human review rather than imply that an automated system grants regulatory approval.',
        'Reliable event delivery, deterministic evaluation, and audit-chain verification each have explicit trust boundaries and should be tested independently.',
      ],
      futureWork: [
        { item: 'Expand automated end-to-end coverage across role-specific workflows', status: 'Planned' },
        { item: 'Harden evidence storage, retention, backup, and deployment safeguards', status: 'Planned' },
        { item: 'Evaluate audit-chain anchoring and independent verification options', status: 'Research' },
        { item: 'Validate operational performance and accessibility with representative users', status: 'Planned' },
      ],
      repoUrl: 'https://github.com/sainithinreddy06/PRAVAAH',
      stack: ['React', 'TypeScript', 'Vite', 'Python', 'FastAPI', 'SQLAlchemy', 'Alembic', 'PostgreSQL', 'Supabase'],
    },
    tapas: {
      slug: 'tapas',
      title: 'TAPAS',
      subtitle: 'Thermal Analytics & Public-health Advisory System',
      overview:
        'TAPAS is an India-focused public heat-safety frontend prototype. It combines place discovery, public weather information, nearby mapped points of interest, and links to official health-reference resources. Scientific risk layers and official relief inventories depend on separately configured, sourced provider data.',
      problem:
        'Extreme heat creates significant public-health risks. TAPAS explores how a location-aware interface can bring weather context, nearby points of interest, and public-health reference information together without presenting unavailable scientific measurements or unverified facilities as facts.',
      whyBuilt:
        'Built to explore a transparent public heat-safety interface, with place search, weather context, map-based nearby information, and clearly scoped reference guidance.',
      architectureSummary:
        'Built with Next.js 15 and React 19, using MapLibre GL for interactive maps, D3 contour for supported visualization workflows, and Recharts for data charts. Scientific overlays require valid, identity-matched source data from a configured API.',
      architectureFlow: [
        { id: '1', label: 'Next.js Frontend', sublabel: 'React 19 & Tailwind CSS', status: 'Prototype' },
        { id: '2', label: 'Location Telemetry', sublabel: 'Place Discovery & Geocoding', status: 'Prototype' },
        { id: '3', label: 'Visualization Layer', sublabel: 'D3 Contour & Recharts', status: 'Prototype' },
        { id: '4', label: 'MapLibre Map', sublabel: 'Nearby Points & Map Layers', status: 'Prototype' },
        { id: '5', label: 'Reference Resources', sublabel: 'Official Links & Scoped Notices', status: 'Prototype' },
      ],
      dataPipeline:
        'Place coordinates and provider responses are validated before display. Weather values and fallback snapshots retain their source and timestamps; unavailable scientific fields remain unavailable rather than being estimated.',
      frontendNotes:
        'Designed with Next.js 15, React 19, MapLibre GL, and Tailwind CSS. Supports fast vector rendering and fluid responsive controls across mobile, tablet, and desktop.',
      backendNotes:
        'Client-side service adapters isolate external geocoding, weather, and optional scientific-data APIs, with request validation, caching, cancellation, and explicit unavailable states.',
      databaseNotes:
        'Nearby points of interest are retrieved from external map data. Official cooling or relief resources appear only when a separately configured, validated authority feed supplies them; the frontend does not bundle a verified national shelter inventory.',
      technicalDecisions: [
        {
          decision: 'MapLibre GL for GIS map rendering',
          rationale: 'High-performance WebGL-based vector map engine without proprietary licensing overhead.',
        },
        {
          decision: 'D3 contour for thermal visualization',
          rationale: 'Generates smooth mathematical contour intervals over telemetry grids for clear heat stress boundaries.',
        },
      ],
      challenges: [
        'Rendering smooth vector thermal contours without blocking UI interactivity on mobile devices.',
        'Handling offline or slow network conditions gracefully with timestamped fallback snapshots.',
      ],
      lessons: [
        'Public-health interfaces should distinguish live provider observations, timestamped snapshots, and unavailable scientific measurements so users can understand the limits of the displayed data.',
      ],
      futureWork: [
        { item: 'Integration with national weather radar satellite feeds', status: 'Planned' },
        { item: 'Automated SMS warning broadcasts for vulnerable zones', status: 'Planned' },
      ],
      repoUrl: 'https://github.com/sainithinreddy06/TAPAS',
      stack: ['Next.js 15', 'React 19', 'TypeScript', 'MapLibre GL', 'D3 Contour', 'Recharts', 'Tailwind CSS'],
    },
    traffiq: {
      slug: 'traffiq',
      title: 'TRAFFIQ',
      subtitle: 'AI Traffic & Accident Risk Prediction — 48-Hour Hackathon Prototype',
      status: 'prototype',
      overview:
        'TRAFFIQ is a 48-hour hackathon prototype (2 GitHub commits) exploring ML-based traffic prediction. It is NOT a production system — the GitHub history does not support the claimed production ML/AI scope. This case study documents a learning experiment only.',
      problem:
        'Urban traffic telemetry is frequently reactive: navigation systems route vehicles around accidents only after congestion has already formed. Drivers and municipality coordinators lack accessible predictive tools that evaluate spatial risk factors before incidents happen.',
      whyBuilt:
        'Built as a rapid hackathon experiment to explore combining geospatial web representations with FastAPI/ML backends. The prototype demonstrates conceptual architecture only.',
      architectureSummary:
        'Conceptual architecture decoupling reactive client view from computational backend. The FastAPI server would ingest segment speed/coordinates, extract windowed features, run through risk estimators, and serve geoJSON layers. Not production-implemented (2 commits total).',
      architectureFlow: [
        { id: '1', label: 'Frontend Client', sublabel: 'React & Interactive Maps', status: 'Prototype' },
        { id: '2', label: 'FastAPI Backend', sublabel: 'Async REST Service', status: 'Prototype' },
        { id: '3', label: 'Data Processing', sublabel: 'Feature Extraction & Windows', status: 'Prototype' },
        { id: '4', label: 'ML Models', sublabel: 'Scikit-learn Regressors/Classifiers', status: 'Prototype' },
        { id: '5', label: 'MongoDB', sublabel: 'Historical Spatial Collection', status: 'Prototype' },
        { id: '6', label: 'Geospatial APIs', sublabel: 'External Tiles & Routing [Planned]', status: 'Planned' },
      ],
      dataPipeline:
        'Conceptual: Segment data would be standardized into uniform temporal buckets. Numerical features include historical speed variance, lane density, junction distance, and simulated weather indices. Not production-implemented.',
      mlPipeline:
        'Conceptual: Feature engineering would isolate road curvature, average segment velocity degradation, and historical peak indices. Not production-implemented (2 commits total).',
      frontendNotes:
        'React and Tailwind CSS prototype with vector-rendered maps and SVG overlays. Not production-implemented.',
      backendNotes:
        'FastAPI asynchronous handlers concept. Not production-implemented (2 commits total).',
      databaseNotes:
        'MongoDB document schema concept. Not production-implemented.',
      technicalDecisions: [
        {
          decision: 'FastAPI instead of Flask or Express for the core service (conceptual)',
          rationale:
            'Async Python execution and Pydantic validation would provide structured request parsing for spatial coordinate data. Not implemented.',
        },
        {
          decision: 'Strict client-side separation of map rendering from ML inference (conceptual)',
          rationale:
            'Would keep predictive computation separate from map rendering to preserve responsive pan-and-zoom. Not implemented.',
        },
      ],
      challenges: [
        'Handling high-frequency coordinate payload serialization without frame stutter on the client.',
        'Normalizing uneven road segment lengths into standardized spatial grids for statistical consistency.',
        'GitHub history: 2 commits — does not support production ML/AI claims.',
      ],
      lessons: [
        'Real-world sensor feeds suffer from sudden dropouts; input validators must handle incomplete feature arrays gracefully.',
        'Visualizing risk gradients requires careful color palette contrast calibration to avoid ambiguous reading in daylight scenarios.',
        'Hackathon prototypes should be clearly labeled — do not present them as production systems.',
      ],
      futureWork: [
        { item: 'Integration with live municipality open-data feeds', status: 'Planned' },
        { item: 'Temporal sequence forecasting with recurrent architectures', status: 'Research' },
        { item: 'Automated weather radar precipitation overlays', status: 'Planned' },
      ],
      repoUrl: 'https://github.com/sainithinreddy06/TRAFFIQ',
      stack: ['React', 'FastAPI', 'Python', 'Scikit-learn', 'MongoDB', 'Tailwind CSS'],
    },
    surestep: {
      slug: 'surestep',
      title: 'SureStep',
      subtitle: 'AI-Powered Outdoor Safety & Navigation Platform — 48-Hour Hackathon Prototype',
      status: 'prototype',
      overview:
        'SureStep is a 48-hour hackathon prototype (8 GitHub commits) exploring on-device computer vision inferences, GPS telemetry, and machine learning models for outdoor navigation. It is NOT a production system — the GitHub history does not support the claimed production ML/AI scope. This case study documents a learning experiment only.',
      problem:
        'Standard turn-by-turn navigation platforms fail when navigating remote wilderness or challenging terrain. They offer no insights into trail conditions, visual hazards, terrain stability, geological hazard monitoring, or offline availability.',
      whyBuilt:
        'Built as a rapid hackathon experiment to explore combining YOLO-based computer vision, Random Forest terrain scoring, and GPS telemetry. The prototype demonstrates conceptual architecture only.',
      architectureSummary:
        'Designed as an edge-oriented full-stack ML architecture concept. Camera frames and terrain features would be processed through lightweight models to evaluate surface hazards, while GPS coordinates query local geospatial caches. None of this is production-implemented.',
      architectureFlow: [
        { id: '1', label: 'Client Application', sublabel: 'React & TypeScript Interface', status: 'Prototype' },
        { id: '2', label: 'Location & GPS', sublabel: 'Device Telemetry Engine', status: 'Prototype' },
        { id: '3', label: 'Backend APIs', sublabel: 'Node.js & FastAPI Pipeline', status: 'Prototype' },
        { id: '4', label: 'Random Forest Model', sublabel: 'Terrain & Environmental Scoring', status: 'Prototype' },
        { id: '5', label: 'AI Ranger Copilot', sublabel: 'Contextual Safety Guidance', status: 'Prototype' },
        { id: '6', label: 'Offline / Cloud Data', sublabel: 'Synced Map Layers', status: 'Planned' },
      ],
      dataPipeline:
        'Conceptual: Processes GPS latitude, longitude, elevation, and heading telemetry in continuous sample buffers, paired with analyzed camera frames and terrain gradient indicators. Not implemented in production.',
      frontendNotes:
        'React and TypeScript interface concept with high-contrast outdoor visibility modes. Prototype only.',
      backendNotes:
        'Conceptual full-stack architecture combining Node.js/Express and FastAPI for ML evaluation. Not production-implemented (8 commits total).',
      databaseNotes:
        'Conceptual local storage for offline trail paths with lightweight geo-indexing. Not implemented.',
      technicalDecisions: [
        {
          decision: 'Machine Learning-based Random Forest model for terrain data (conceptual)',
          rationale:
            'Would provide robust multi-factor risk scoring across slope, terrain roughness, weather conditions, and geological metrics with high interpretability. Not implemented.',
        },
      ],
      challenges: [
        'Battery conservation while simultaneously acquiring GPS locks and running evaluation cycles.',
        'Calibrating orientation sensors under fluctuating magnetic anomalies in outdoor rocky terrains.',
        'GitHub history: 8 commits — does not support production ML/AI claims.',
      ],
      lessons: [
        'Outdoor navigation requires clear, large typography and single-touch controls designed for one-handed operation.',
        'Hackathon prototypes should be clearly labeled — do not present them as production systems.',
      ],
      futureWork: [
        { item: 'Offline vector contour map caching', status: 'Planned' },
        { item: 'Mesh-network SOS beaconing across nearby peer devices', status: 'Planned' },
      ],
      repoUrl: 'https://github.com/sainithinreddy06/SureStep',
      stack: ['React', 'TypeScript', 'Node.js', 'FastAPI', 'Python', 'Scikit-learn'],
    },
    vidyavistaar: {
      slug: 'vidyavistaar',
      title: 'VidyaVistaar',
      subtitle: 'AI-Powered Educational Learning Platform — Hackathon Prototype',
      status: 'prototype',
      overview:
        'VidyaVistaar is a hackathon prototype (4 GitHub commits) exploring Google Gemini AI integration with React 19 for educational Q&A. It is NOT a production system — the GitHub history does not support the claimed production scope. This case study documents a learning experiment only.',
      problem:
        'Traditional learning management systems often deliver static content without immediate, adaptive explanations or visual progress feedback, leading to disengagement during self-guided study.',
      whyBuilt:
        'Built as a rapid hackathon experiment to explore practical integration of Google GenAI SDK with type-safe React frontend workflows. The prototype demonstrates conceptual architecture only.',
      architectureSummary:
        'Conceptual modular component-based frontend architecture connecting client UI components, Recharts telemetry visualizations, and Google Gemini API services. Not production-implemented (4 commits total).',
      architectureFlow: [
        { id: '1', label: 'User Interface', sublabel: 'Type-Safe React 19 & Tailwind', status: 'Prototype' },
        { id: '2', label: 'Service Layer', sublabel: 'Google GenAI SDK Connector', status: 'Prototype' },
        { id: '3', label: 'Gemini AI Engine', sublabel: 'Contextual Student Guidance', status: 'Prototype' },
        { id: '4', label: 'Data Visualizer', sublabel: 'Interactive Recharts Dashboards', status: 'Prototype' },
      ],
      dataPipeline:
        'Conceptual: User queries and study contexts would be structured and dispatched to Gemini models with targeted instructional prompts. Student performance metrics would be mapped to Recharts data streams. Not production-implemented.',
      frontendNotes:
        'React 19, Vite, and Tailwind CSS prototype. Features accessible responsive components and visualization dashboards. Not production-implemented.',
      backendNotes:
        'Frontend service layer calls Google Gemini through GenAI SDK. API availability, latency, quotas, and key protection depend on deployment configuration. Not production-implemented (4 commits total).',
      databaseNotes:
        'Conceptual stateless client architecture with browser caching. Not production-implemented.',
      technicalDecisions: [
        {
          decision: 'Google GenAI SDK over generic REST endpoints (conceptual)',
          rationale:
            'Native TypeScript SDK would provide typed responses, built-in retry handling, and direct prompt streaming capability. Not implemented.',
        },
        {
          decision: 'Recharts for data visualization (conceptual)',
          rationale:
            'Declarative SVG charting designed for React, providing smooth animations and responsiveness across screen sizes. Not implemented.',
        },
      ],
      challenges: [
        'Formatting structured generative responses into digestible study cards without UI layout shifts.',
        'Optimizing chart re-renders when student telemetry streams update.',
        'GitHub history: 4 commits — does not support production AI/ML claims.',
      ],
      lessons: [
        'Pairing generated explanations with charts can make learning content easier to explore; the educational impact has not been formally measured.',
        'Hackathon prototypes should be clearly labeled — do not present them as production systems.',
      ],
      futureWork: [
        { item: 'Adaptive multi-subject learning pathways', status: 'Planned' },
        { item: 'Collaborative peer study sessions', status: 'Planned' },
      ],
      repoUrl: 'https://github.com/sainithinreddy06/VidyaVistaar',
      stack: ['React', 'TypeScript', 'Google Gemini AI', 'Recharts', 'Vite', 'Tailwind CSS'],
    },
  },
  skillCategories: [
    {
      title: 'AI & Machine Learning',
      skills: [
        { name: 'Python', verifyTag: true },
        { name: 'Scikit-learn', verifyTag: true },
        { name: 'XGBoost', verifyTag: true },
        { name: 'YOLO & Computer Vision', verifyTag: true },
        { name: 'Pandas & NumPy', verifyTag: true },
      ],
    },
    {
      title: 'Cloud & DevOps',
      skills: [
        { name: 'GitHub Actions', verifyTag: false },
        { name: 'Docker', verifyTag: true },
        { name: 'Render', verifyTag: true },
        { name: 'Supabase', verifyTag: true },
        { name: 'REST API Development', verifyTag: true },
      ],
    },
    {
      title: 'Databases & Data Management',
      skills: [
        { name: 'PostgreSQL', verifyTag: true },
        { name: 'MongoDB', verifyTag: false },
        { name: 'SQL', verifyTag: true },
        { name: 'MySQL', verifyTag: false },
      ],
    },
    {
      title: 'Core Computer Science & Tools',
      skills: [
        { name: 'Data Structures & Algorithms', verifyTag: true },
        { name: 'Object-Oriented Programming', verifyTag: true },
        { name: 'DBMS, Operating Systems & Networks', verifyTag: true },
        { name: 'Git & GitHub', verifyTag: true },
        { name: 'Docker', verifyTag: true },
        { name: 'Visual Studio Code', verifyTag: true },
      ],
    },
  ],
  timeline: [
    {
      id: 'cbit-education',
      role: 'B.E./B.Tech. – Computer Science & Engineering',
      organization: 'Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad',
      period: '2024 – 2028',
      type: 'Education',
      achievementBadge: 'CGPA: 8.96',
      description:
        'Undergraduate studies in core Computer Science & Engineering covering Data Structures, Algorithms, Discrete Mathematics, Operating Systems, Database Management Systems, and Machine Learning.',
    },
    {
      id: 'iedeathon-iete-cbit-2026',
      role: 'CivicSnap — 1st Place, IEDeathon',
      organization: 'IETE CBIT Club',
      period: '2026',
      type: 'Competition',
      achievementBadge: '1st Place Winner',
      description:
        'Won 1st place at IEDeathon with CivicSnap, a smart-city solution aligned with UN Sustainable Development Goal 11 (Sustainable Cities and Communities), focused on efficient resource management, waste reduction, and better public services.',
    },
    {
      id: 'narayana-intermediate',
      role: 'Board of Intermediate Education, Telangana',
      organization: 'Narayana Institutions, Hyderabad',
      period: '2022 – 2024',
      type: 'Education',
      achievementBadge: 'CGPA: 9.41',
      description:
        'Higher secondary education with intensive foundation in Mathematics, Physics, and Chemistry.',
    },
    {
      id: 'asteroid-comp',
      role: '3rd Place Awardee',
      organization: 'Asteroid Hazard Classification Competition',
      period: '2024',
      type: 'Competition',
      achievementBadge: '3rd Place',
      description:
        'Built machine learning classification models evaluating astronomical and orbital trajectory features to categorize hazardous near-Earth objects.',
    },
    {
      id: 'eamcet-rank',
      role: 'Rank 2337',
      organization: 'TS EAMCET 2024 (Telangana State Engineering Entrance)',
      period: '2024',
      type: 'Competition',
      achievementBadge: 'Rank 2337',
      description:
        'Secured Rank 2337 in the Telangana State Engineering Entrance Test (TS EAMCET) 2024.',
    },
    {
      id: 'rmc-involvement',
      role: 'Head of PR & Social Media',
      organization: 'Ramanujan Mathematics Club (RMC), CBIT',
      period: '2024 – Present',
      type: 'Involvement',
      description:
        'Leading public relations, social media communication, outreach, and student engagement for club initiatives, technical events, and symposiums.',
    },
    {
      id: 'chaitanya-spandana',
      role: 'Social Welfare Club Member',
      organization: 'Chaitanya Spandana, CBIT',
      period: '2024 – Present',
      type: 'Involvement',
      description:
        'Participating in community social welfare initiatives, student mentorship drives, and campus outreach activities.',
    },
    {
      id: 'technical-certifications',
      role: 'Technical Certifications',
      organization: 'Verified Online Credentials & Professional Assessments',
      period: '2024 – 2026',
      type: 'Involvement',
      description:
        '• React Web Development Certification • Generative AI & LLM Architecture Certification • Java Programming & OOP Principles Certification',
    },
    {
      id: 'sih-nominations',
      role: 'College-Level Nominee — Smart India Hackathon',
      organization: 'Smart India Hackathon (SIH), CBIT',
      period: 'Two college-level nominations',
      type: 'Competition',
      achievementBadge: '2× Nominated',
      description:
        'Nominated twice at the college level for Smart India Hackathon (SIH), recognizing proposed solutions during the institution-level selection process.',
    },
    {
      id: 'cyberfest-ctf',
      role: 'Participant',
      organization: 'CyberFest / CTF',
      period: '2024',
      type: 'Involvement',
      description:
        'Engaged in Capture The Flag technical challenges focusing on systems analysis, web security, and cryptographic problem solving.',
    },
  ],
};
