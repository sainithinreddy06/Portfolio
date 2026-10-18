export type FeatureStatus = 'Implemented' | 'Prototype' | 'Research' | 'Planned';

export interface ProjectFeature {
  name: string;
  status: FeatureStatus;
  note?: string;
}

export interface ArchitectureDiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  status: 'Implemented' | 'Prototype' | 'Planned';
}

export interface ArchitectureFlow {
  title: string;
  summary: string;
  nodes: ArchitectureDiagramNode[];
}

export interface CaseStudyData {
  slug: string;
  title: string;
  subtitle: string;
  overview: string;
  problem: string;
  whyBuilt: string;
  architectureSummary: string;
  architectureFlow: ArchitectureDiagramNode[];
  dataPipeline: string;
  mlPipeline?: string;
  frontendNotes: string;
  backendNotes: string;
  databaseNotes: string;
  technicalDecisions: { decision: string; rationale: string }[];
  challenges: string[];
  lessons: string[];
  futureWork: { item: string; status: 'Planned' | 'Research' }[];
  repoUrl?: string;
  stack: string[];
}

export interface DeploymentSourceInfo {
  provider: 'netlify' | 'vercel' | 'github_pages' | 'github_homepage' | 'readme_docs' | 'fallback_verified';
  url: string;
  verified: boolean;
  notes?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  tagline: string;
  category?: string;
  stack: string[];
  description: string;
  summary: string;
  status: 'Prototype' | 'Implemented' | 'Research';
  features: ProjectFeature[];
  githubUrl?: string;
  liveUrl?: string;
  deploymentInfo?: DeploymentSourceInfo;
  caseStudySlug?: string;
  achievementBadge?: string;
  hasArchitecture: boolean;
  architectureFlow?: ArchitectureFlow;
  featured?: boolean;
  visible?: boolean;
  order?: number;
  source?: 'curated' | 'github' | 'resume' | 'hybrid' | 'manual';
  repositoryId?: number;
  githubRepoName?: string;
  starsCount?: number;
  lastUpdated?: string;
  lastSyncedAt?: string;
  topics?: string[];
  isArchived?: boolean;
  isUnavailable?: boolean;
  isManualOverride?: boolean;
}

export interface SkillCategory {
  title: string;
  skills: { name: string; verifyTag?: boolean }[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  type: 'Education' | 'Involvement' | 'Competition';
  description?: string;
  verifyNote?: string;
  achievementBadge?: string;
}

export interface PhotoVersionItem {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  timestamp: number;
  url: string;
  isActive: boolean;
}

export interface PhotoConfig {
  url: string;
  altText: string;
  showInHero: boolean;
  showInAbout: boolean;
  isPlaceholder: boolean;
  versions?: PhotoVersionItem[];
}

export interface ResumeVersionItem {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  timestamp: number;
  fileUrl: string;
  isActive: boolean;
}

export interface ResumeConfig {
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  isAvailable: boolean;
  comingSoonMessage: string;
  versions?: ResumeVersionItem[];
}

export interface ProfileData {
  name: string;
  wordmark: string;
  positioning: string;
  headline: string;
  supportingCopy: string;
  institution: string;
  degree: string;
  batchPeriod: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  leetcodeUrl?: string;
  leetcodeUsername?: string;
  aboutText: string[];
  currentLearningDirection: string;
  learningDirectionVerifyNote?: string;
  photo: PhotoConfig;
  resume: ResumeConfig;
}

export interface PortfolioContent {
  profile: ProfileData;
  projects: ProjectItem[];
  caseStudies: Record<string, CaseStudyData>;
  skillCategories: SkillCategory[];
  timeline: ExperienceItem[];
  lastSynced?: string;
}
