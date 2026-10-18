import { PortfolioContent, ProjectItem, DeploymentSourceInfo } from '../src/content/types';

export type DataSource = 'curated' | 'github' | 'resume' | 'hybrid' | 'manual';

export interface FieldSourceTracker {
  name: DataSource;
  tagline: DataSource;
  description: DataSource;
  stack: DataSource;
  githubUrl: DataSource;
  liveUrl?: DataSource;
  features: DataSource;
  caseStudySlug?: DataSource;
}

export interface ExtendedProjectItem extends ProjectItem {
  repositoryId?: number;
  repoFullName?: string;
  source?: DataSource;
  sources?: FieldSourceTracker;
  isArchived?: boolean;
  isUnavailable?: boolean;
  lastSyncedAt?: string;
  order?: number;
  featured?: boolean;
}

export interface ParsedResumeProject {
  name: string;
  description: string;
  technologies: string[];
  role?: string;
  outcomes?: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export interface ParsedResumeData {
  fullName: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  education?: {
    institution: string;
    degree: string;
    batchPeriod?: string;
    score?: string;
  }[];
  skills?: {
    category: string;
    skills: string[];
  }[];
  experience?: {
    role: string;
    organization: string;
    period: string;
    description?: string;
    type?: 'Education' | 'Involvement' | 'Competition';
  }[];
  projects?: ParsedResumeProject[];
  certifications?: string[];
  achievements?: string[];
}

export interface ResumeChangeItem {
  id: string;
  category: 'profile' | 'skill' | 'project' | 'experience' | 'achievement';
  action: 'add' | 'update' | 'remove';
  title: string;
  description: string;
  currentValue?: any;
  incomingValue?: any;
  approved: boolean;
}

export interface ResumeDiffResult {
  summary: string;
  changes: ResumeChangeItem[];
  parsedRaw: ParsedResumeData;
}

export interface PortfolioStoreState {
  version: number;
  lastUpdated: string;
  lastSyncAttempt?: string;
  syncStatus?: {
    lastSuccess: string;
    totalReposFound: number;
    eligibleCount: number;
    rateLimitRemaining?: number;
    rateLimitReset?: string;
    lastError?: string;
  };
  content: PortfolioContent;
  syncedRepositories: Record<string, {
    repoId: number;
    name: string;
    fullName: string;
    homepage?: string | null;
    liveUrl?: string | null;
    syncedAt: string;
    topics: string[];
  }>;
  manualOverrides: {
    hiddenProjectIds?: string[];
    featuredProjectIds?: string[];
    projectOrder?: string[];
    customProjectFields?: Record<string, Partial<ProjectItem>>;
  };
}
