import { readApiJson } from '../services/apiResponse';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../content';
import { processImageTransparency } from '../components/common/PhotoFrame';
import {
  ShieldCheck,
  LogOut,
  Camera,
  FileText,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  Download,
  Terminal,
  Upload,
  GitBranch,
  RefreshCw,
  ExternalLink,
  Layers,
  Trash2,
  Activity,
  Link as LinkIcon,
  X,
  History,
  FileCheck,
  CheckCircle,
} from 'lucide-react';
import { ProjectItem, ResumeVersionItem, PhotoVersionItem } from '../content/types';
import { ProjectForm } from '../components/admin/ProjectForm';
import { ProjectConfirmation } from '../components/admin/ProjectConfirmation';
import { downloadResume } from '../utils/resumeManager';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { content, updateContent, resetContent, refreshServerPortfolio } = usePortfolio();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('sai_nithin_admin_auth') === 'true' &&
      Boolean(
        sessionStorage.getItem('sai_nithin_admin_token') ||
          localStorage.getItem('sai_nithin_admin_token')
      )
    );
  });
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'projects' | 'github' | 'photo' | 'resume' | 'profile' | 'export'
  >('resume');

  // Notification and Status
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Draft Content
  const [draft, setDraft] = useState(content);

  // Projects State
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);

  // GitHub Diagnostics
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [githubSyncMsg, setGithubSyncMsg] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<any | null>(null);

  // Photo Management State
  const [photoUrlInput, setPhotoUrlInput] = useState(content.profile.photo.url || '');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume Management State
  const [resumeUrlInput, setResumeUrlInput] = useState(content.profile.resume.fileUrl || '');
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [resumeDragOver, setResumeDragOver] = useState(false);
  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize draft when content updates
  useEffect(() => {
    setDraft(content);
    if (content.profile.photo.url) {
      setPhotoUrlInput(content.profile.photo.url);
    }
    if (content.profile.resume.fileUrl) {
      setResumeUrlInput(content.profile.resume.fileUrl);
    }
  }, [content]);

  // Robots meta tag for admin privacy
  useEffect(() => {
    let metaNoIndex = document.querySelector('meta[name="robots"]');
    if (!metaNoIndex) {
      metaNoIndex = document.createElement('meta');
      metaNoIndex.setAttribute('name', 'robots');
      metaNoIndex.setAttribute('content', 'noindex, nofollow');
      document.head.appendChild(metaNoIndex);
    } else {
      metaNoIndex.setAttribute('content', 'noindex, nofollow');
    }
    return () => {
      metaNoIndex?.setAttribute('content', 'index, follow');
    };
  }, []);

  // Helper to obtain current token
  const getAdminToken = (): string | null => {
    return (
      sessionStorage.getItem('sai_nithin_admin_token') ||
      localStorage.getItem('sai_nithin_admin_token')
    );
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      setIsVerifyingSession(true);
      const token = getAdminToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsVerifyingSession(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await readApiJson(res);
          if (data.success) {
            setIsAuthenticated(true);
            sessionStorage.setItem('sai_nithin_admin_auth', 'true');
            sessionStorage.setItem('sai_nithin_admin_token', token);
          } else {
            handleSessionInvalid();
          }
        } else {
          handleSessionInvalid();
        }
      } catch {
        // Network error; preserve state if already authenticated
      } finally {
        setIsVerifyingSession(false);
      }
    };

    verifySession();
  }, []);

  const handleSessionInvalid = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('sai_nithin_admin_auth');
    sessionStorage.removeItem('sai_nithin_admin_token');
    localStorage.removeItem('sai_nithin_admin_token');
  };

  /**
   * Authenticated Fetch Wrapper that catches 401s cleanly
   */
  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      handleSessionInvalid();
      setAuthError('Your admin session has expired. Please sign in again.');
      throw new Error('Admin session expired. Please sign in again.');
    }
    if (!res.ok) {
      const data = await readApiJson(res);
      throw new Error(data.error || `Request failed (HTTP ${res.status}).`);
    }
    return res;
  };

  // Diagnostics for GitHub sync
  const fetchDiagnostics = async () => {
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const data = await readApiJson(res);
        if (data.success) {
          setDiagnostics(data.diagnostics);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'github') {
      fetchDiagnostics();
    }
  }, [isAuthenticated, activeTab]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    const user = emailInput.trim().toLowerCase();
    const password = passwordInput;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user, password }),
      });
      const data = await readApiJson(res);

      if (res.ok && data.success && data.token) {
        setIsAuthenticated(true);
        sessionStorage.setItem('sai_nithin_admin_auth', 'true');
        sessionStorage.setItem('sai_nithin_admin_token', data.token);
        localStorage.setItem('sai_nithin_admin_token', data.token);
        setAuthError('');
      } else {
        setAuthError(data.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Unable to connect to authentication service.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    const token = getAdminToken();
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    handleSessionInvalid();
  };

  // -------------------------------------------------------------
  // RESUME MANAGEMENT LOGIC
  // -------------------------------------------------------------

  /**
   * Validates client-side that file is a PDF with magic bytes
   */
  const validatePdfFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return { valid: false, error: 'File must be a valid PDF document (.pdf extension).' };
    }
    if (file.size > 4 * 1024 * 1024) {
      return { valid: false, error: 'Resume PDF exceeds the 4 MB upload limit. Use a hosted URL for larger files.' };
    }

    try {
      const headerSlice = file.slice(0, 5);
      const buffer = await headerSlice.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const headerString = String.fromCharCode(...bytes);
      if (!headerString.startsWith('%PDF-')) {
        return {
          valid: false,
          error: 'The uploaded file does not contain a valid PDF signature (%PDF-). Please choose a valid PDF.',
        };
      }
    } catch {
      // Fallback if ArrayBuffer fails
    }

    return { valid: true };
  };

  const uploadResumeFile = async (file: File) => {
    setIsSavingResume(true);
    setErrorMessage('');
    try {
      const validation = await validatePdfFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid PDF file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const dataUri = ev.target?.result as string;
          if (!dataUri) throw new Error('Could not read file data.');

          const sizeFormatted =
            file.size < 1024 * 1024
              ? `${Math.round(file.size / 1024)} KB`
              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

          const res = await authFetch('/api/portfolio/resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUri,
              fileName: file.name,
              fileSize: sizeFormatted,
              isAvailable: true,
              comingSoonMessage: 'Verified custom curriculum vitae active.',
            }),
          });

          const data = await readApiJson(res);
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Server error uploading resume file.');
          }

          const updated = {
            ...draft,
            profile: {
              ...draft.profile,
              resume: data.resume,
            },
          };
          setDraft(updated);
          updateContent(updated);
          setResumeUrlInput(data.resume.fileUrl);
          await refreshServerPortfolio();

          setSuccessMessage(`Resume "${file.name}" uploaded and set as active published resume!`);
          setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to process resume upload.');
        } finally {
          setIsSavingResume(false);
          if (resumeFileInputRef.current) resumeFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload resume file.');
      setIsSavingResume(false);
    }
  };

  const handleResumeFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadResumeFile(file);
    }
  };

  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setResumeDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadResumeFile(file);
    }
  };

  const handleApplyResumeUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = resumeUrlInput.trim();
    if (!cleanUrl) {
      setErrorMessage('Please enter a valid resume URL or file link.');
      return;
    }
    setIsSavingResume(true);
    setErrorMessage('');
    try {
      const res = await authFetch('/api/portfolio/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: cleanUrl,
          fileName: cleanUrl.split('/').pop() || 'Curriculum_Vitae.pdf',
          fileSize: cleanUrl.includes('drive.google.com') ? 'Google Drive' : 'Cloud Document',
          isAvailable: true,
          comingSoonMessage:
            draft.profile.resume.comingSoonMessage || 'Verified curriculum vitae available.',
        }),
      });
      const data = await readApiJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error saving resume URL.');
      }
      const updated = {
        ...draft,
        profile: {
          ...draft.profile,
          resume: data.resume,
        },
      };
      setDraft(updated);
      updateContent(updated);
      await refreshServerPortfolio();
      setSuccessMessage('Resume URL saved and active across all views!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save resume URL.');
    } finally {
      setIsSavingResume(false);
    }
  };

  const handleRollbackResume = async (version: ResumeVersionItem) => {
    if (!window.confirm(`Rollback and publish resume version from ${version.uploadedAt}?`)) return;
    setIsSavingResume(true);
    setErrorMessage('');
    try {
      const res = await authFetch('/api/portfolio/resume/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id }),
      });
      const data = await readApiJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error rolling back resume version.');
      }
      const updated = {
        ...draft,
        profile: {
          ...draft.profile,
          resume: data.resume,
        },
      };
      setDraft(updated);
      updateContent(updated);
      await refreshServerPortfolio();
      setSuccessMessage(`Rolled back to resume version from ${version.uploadedAt}!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to rollback resume.');
    } finally {
      setIsSavingResume(false);
    }
  };

  const handleDeleteResumeVersion = async (versionId: string) => {
    if (!window.confirm('Delete this historical resume file from storage?')) return;
    setIsSavingResume(true);
    setErrorMessage('');
    try {
      const res = await authFetch(`/api/portfolio/resume/version/${versionId}`, {
        method: 'DELETE',
      });
      const data = await readApiJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error deleting resume version.');
      }
      const updatedVersions = data.versions;
      const updated = {
        ...draft,
        profile: {
          ...draft.profile,
          resume: {
            ...draft.profile.resume,
            versions: updatedVersions,
          },
        },
      };
      setDraft(updated);
      updateContent(updated);
      setSuccessMessage('Resume version removed from history.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete resume version.');
    } finally {
      setIsSavingResume(false);
    }
  };

  const handleResetResume = async () => {
    if (!window.confirm('Reset resume to built-in verified curriculum vitae viewer?')) return;
    setIsSavingResume(true);
    setErrorMessage('');
    try {
      const res = await authFetch('/api/portfolio/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      const data = await readApiJson(res);
      const updated = {
        ...draft,
        profile: {
          ...draft.profile,
          resume: data.resume,
        },
      };
      setDraft(updated);
      updateContent(updated);
      setResumeUrlInput('');
      await refreshServerPortfolio();
      setSuccessMessage('Resume reset to built-in curriculum vitae viewer.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset resume.');
    } finally {
      setIsSavingResume(false);
    }
  };

  // -------------------------------------------------------------
  // PROFILE PHOTO MANAGEMENT LOGIC
  // -------------------------------------------------------------

  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!validMimes.includes(file.type) && !hasValidExt) {
      return { valid: false, error: 'Only JPG, PNG, and WEBP image formats are supported.' };
    }
    if (file.size > 4 * 1024 * 1024) {
      return { valid: false, error: 'Image exceeds the maximum 4 MB size limit.' };
    }
    return { valid: true };
  };

  const uploadPhotoFile = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file.');
      return;
    }

    setIsSavingPhoto(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUri = event.target?.result as string;
      processImageTransparency(rawDataUri, async (cleanTransparentUri) => {
        const activeUri = cleanTransparentUri || rawDataUri;
        try {
          const res = await authFetch('/api/portfolio/photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUri: activeUri,
              fileName: file.name,
              altText:
                draft.profile.photo.altText ||
                `Portrait of ${draft.profile.name}, Computer Science & Engineering student at Chaitanya Bharathi Institute of Technology (CBIT)`,
            }),
          });
          const data = await readApiJson(res);
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Server error saving portrait image.');
          }

          const updated = {
            ...draft,
            profile: {
              ...draft.profile,
              photo: data.photo,
            },
          };
          setDraft(updated);
          updateContent(updated);
          setPhotoUrlInput(data.photo.url);
          await refreshServerPortfolio();
          setSuccessMessage('Portrait photograph uploaded, optimized, and active!');
          setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to upload photo.');
        } finally {
          setIsSavingPhoto(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoFile(file);
    }
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPhotoDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadPhotoFile(file);
    }
  };

  const handleApplyPhotoUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = photoUrlInput.trim();
    if (!cleanUrl) {
      setErrorMessage('Please enter a valid image URL.');
      return;
    }
    setIsSavingPhoto(true);
    setErrorMessage('');
    try {
      const res = await authFetch('/api/portfolio/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: cleanUrl,
          altText:
            draft.profile.photo.altText ||
            `Portrait of ${draft.profile.name}, Computer Science & Engineering student at Chaitanya Bharathi Institute of Technology (CBIT)`,
        }),
      });
      const data = await readApiJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error saving photo URL.');
      }
      const updated = {
        ...draft,
        profile: {
          ...draft.profile,
          photo: data.photo,
        },
      };
      setDraft(updated);
      updateContent(updated);
      await refreshServerPortfolio();
      setSuccessMessage('Photograph URL applied and synchronized across all views!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save photograph URL.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleRollbackPhoto = async (version: PhotoVersionItem) => {
    if (!window.confirm(`Restore portrait uploaded on ${version.uploadedAt}?`)) return;
    setIsSavingPhoto(true);
    setErrorMessage('');
    try {
      const res = await authFetch('/api/portfolio/photo/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id }),
      });
      const data = await readApiJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error restoring photo version.');
      }
      const updated = {
        ...draft,
        profile: {
          ...draft.profile,
          photo: data.photo,
        },
      };
      setDraft(updated);
      updateContent(updated);
      await refreshServerPortfolio();
      setSuccessMessage(`Restored portrait from ${version.uploadedAt}!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to restore portrait.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleDeletePhotoVersion = async (versionId: string) => {
    if (!window.confirm('Delete this historical photo permanently?')) return;
    setIsSavingPhoto(true);
    setErrorMessage('');
    try {
      const res = await authFetch(`/api/portfolio/photo/version/${versionId}`, {
        method: 'DELETE',
      });
      const data = await readApiJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error deleting photo version.');
      }
      const updated = {
        ...draft,
        profile: {
          ...draft.profile,
          photo: {
            ...draft.profile.photo,
            versions: data.versions,
          },
        },
      };
      setDraft(updated);
      updateContent(updated);
      setSuccessMessage('Photo version removed from gallery.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete photo version.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleResetPhoto = async () => {
    if (!window.confirm('Reset portrait to default monogram frame?')) return;
    setIsSavingPhoto(true);
    setErrorMessage('');
    try {
      const res = await authFetch('/api/portfolio/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      const data = await readApiJson(res);
      const updated = {
        ...draft,
        profile: {
          ...draft.profile,
          photo: data.photo,
        },
      };
      setDraft(updated);
      updateContent(updated);
      setPhotoUrlInput('');
      await refreshServerPortfolio();
      setSuccessMessage('Portrait reset to monogram placeholder.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset photo.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // General Save
  const handleSave = async () => {
    try {
      await authFetch('/api/portfolio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      updateContent(draft);
      setSuccessMessage('Settings persisted successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to persist settings.');
    }
  };

  const persistPortfolioChanges = async (newContent: typeof draft, message: string) => {
    try {
      await authFetch('/api/portfolio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
      setDraft(newContent);
      updateContent(newContent);
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to persist changes.');
    }
  };

  // Project management handlers
  const handleSaveNewProject = async (newProject: ProjectItem) => {
    const updatedProjects = [...draft.projects, newProject];
    const updatedContent = { ...draft, projects: updatedProjects };
    await persistPortfolioChanges(
      updatedContent,
      `Project "${newProject.name}" added to portfolio.`
    );
    setIsAddingProject(false);
  };

  const handleUpdateProject = async (updatedProject: ProjectItem) => {
    const updatedProjects = draft.projects.map((p) =>
      p.id === updatedProject.id ? updatedProject : p
    );
    const updatedContent = { ...draft, projects: updatedProjects };
    await persistPortfolioChanges(
      updatedContent,
      `Project "${updatedProject.name}" updated successfully.`
    );
    setEditingProject(null);
  };

  const handleDeleteProject = async (project: ProjectItem) => {
    const updatedProjects = draft.projects.filter((p) => p.id !== project.id);
    const updatedContent = { ...draft, projects: updatedProjects };
    await persistPortfolioChanges(
      updatedContent,
      `Project "${project.name}" deleted successfully.`
    );
    setDeletingProject(null);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draft, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetStore = async () => {
    if (!window.confirm('Reset portfolio content to baseline initial code configuration?')) return;
    try {
      await authFetch('/api/portfolio/reset', { method: 'POST' });
      resetContent();
      await refreshServerPortfolio();
      setSuccessMessage('Portfolio reset to baseline verified configuration.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset store.');
    }
  };

  // -------------------------------------------------------------
  // RENDER: LOGIN FORM
  // -------------------------------------------------------------
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="flex items-center gap-3 font-mono text-xs text-[var(--text-secondary)]">
          <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
          <span>Verifying secure admin session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-2xl">
          <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[var(--accent-primary)]">
            <ShieldCheck className="w-4 h-4" />
            <span>PORTFOLIO ADMIN CONSOLE</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">
            Administrator Authentication
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
            Authorized management for Sai Nithin Reddy&apos;s verified curriculum vitae, portrait photograph, and project engineering records.
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-xs text-[var(--color-danger)] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase font-medium">
                Admin Email / Username
              </label>
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@domain.com or username"
                autoComplete="username"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase font-medium">
                Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs tracking-wider uppercase font-semibold transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <span>AUTHENTICATE &amp; ENTER</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>SECURE REST STORAGE</span>
            <button
              onClick={() => navigate('/')}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Back to Public Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-20 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)] mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-secondary)] mb-1">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>PORTFOLIO ASSET &amp; CONTENT MANAGEMENT</span>
              <span className="opacity-40">·</span>
              <span className="text-[var(--color-success)] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                SESSION ACTIVE
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Portfolio Control Center
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--text-primary)] text-xs font-mono text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Site</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--color-danger)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--color-danger)] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Global Success / Error Banners */}
        {successMessage && (
          <div className="mb-6 p-3.5 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-xs text-[var(--color-success)] flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-[var(--color-success)] hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-xs text-[var(--color-danger)] flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-[var(--color-danger)] hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-[var(--border-subtle)] pb-3">
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'resume'
                ? 'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
            <span>Resume &amp; CV Document</span>
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Profile Photo</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('projects');
              setIsAddingProject(false);
              setEditingProject(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Projects Archive</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'github'
                ? 'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-[var(--color-success)]" />
            <span>GitHub Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
            <span>Profile Data</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Backup &amp; Export</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* TAB 1: RESUME SECTION */}
        {/* ============================================================= */}
        {activeTab === 'resume' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-secondary)] uppercase">
                      RESUME MANAGEMENT &amp; PUBLICATION
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--color-success)] border border-[var(--border-subtle)] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                      {draft.profile.resume.fileName ? 'Custom PDF Active' : 'Default CV Active'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-mono uppercase">
                    Curriculum Vitae &amp; Resume PDF System
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-2xl leading-relaxed">
                    Upload or replace your official resume PDF. Files are permanently persisted in storage, versioned, mirrored to static production assets (<code>/resume.pdf</code>), and wired directly to both <strong>View Resume</strong> and <strong>Download Resume</strong> buttons.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-sm bg-[var(--surface-elevated)] hover:border-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>View /resume.pdf</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setResumePreviewOpen(true)}
                    className="px-3 py-1.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Document</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Active Resume State Card */}
                <div className="md:col-span-5 flex flex-col space-y-3">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
                    Published Document Card
                  </span>
                  <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden flex flex-col justify-between p-5 relative shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--accent-secondary)]">
                          <FileText className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30 font-semibold uppercase">
                          Published
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] font-mono truncate" title={draft.profile.resume.fileName || 'Sai_Nithin_Reddy_Resume.pdf'}>
                          {draft.profile.resume.fileName || 'Sai_Nithin_Reddy_Resume.pdf'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[var(--text-secondary)]">
                          <span>{draft.profile.resume.fileSize || 'PDF Document'}</span>
                          <span>·</span>
                          <span className="text-[var(--text-muted)]">
                            {draft.profile.resume.uploadedAt || 'Current Version'}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2">
                          Single Source Path: <code className="text-[var(--accent-primary)] font-bold">/resume.pdf</code>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-5 mt-4 border-t border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2">
                        <a
                          href="/resume.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 px-3 rounded-sm bg-[var(--surface-elevated)] hover:border-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 text-[var(--accent-primary)]" />
                          <span>Open in Tab</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadResume(draft)}
                          className="flex-1 py-1.5 px-3 rounded-sm bg-[var(--surface-elevated)] hover:border-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-[var(--color-success)]" />
                          <span>Download</span>
                        </button>
                      </div>

                      {draft.profile.resume.fileName && (
                        <button
                          type="button"
                          onClick={handleResetResume}
                          disabled={isSavingResume}
                          className="w-full text-center text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer pt-2 flex items-center justify-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset to Built-in CV Fallback</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload & Configuration Form */}
                <div className="md:col-span-7 space-y-6">
                  {/* Drag and Drop Upload Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setResumeDragOver(true);
                    }}
                    onDragLeave={() => setResumeDragOver(false)}
                    onDrop={handleResumeDrop}
                    className={`p-6 rounded-xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer ${
                      resumeDragOver
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                        : 'border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] bg-[var(--bg-secondary)]'
                    }`}
                    onClick={() => resumeFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={resumeFileInputRef}
                      accept="application/pdf,.pdf"
                      onChange={handleResumeFileInputChange}
                      className="hidden"
                    />
                    <div className="p-3 rounded-full bg-[var(--surface-elevated)] text-[var(--color-success)]">
                      {isSavingResume ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                        {isSavingResume ? 'Uploading & Validating PDF...' : 'Click to Upload or Drag & Drop Resume PDF'}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                        Strict validation: Standard PDF files up to 4MB.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSavingResume}
                      className="mt-1 px-4 py-1.5 rounded-sm bg-[var(--surface-elevated)] hover:bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] cursor-pointer"
                    >
                      Browse PDF File
                    </button>
                  </div>

                  {/* Alternative: Direct URL link */}
                  <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] space-y-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                      <span className="text-xs font-bold font-mono uppercase text-[var(--text-primary)]">
                        Or Provide External Resume URL (e.g. Google Drive)
                      </span>
                    </div>
                    <form onSubmit={handleApplyResumeUrl} className="flex gap-2">
                      <input
                        type="url"
                        value={resumeUrlInput}
                        onChange={(e) => setResumeUrlInput(e.target.value)}
                        placeholder="https://drive.google.com/file/... or https://domain.com/resume.pdf"
                        className="flex-1 px-3 py-1.5 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-secondary)]"
                      />
                      <button
                        type="submit"
                        disabled={isSavingResume || !resumeUrlInput.trim()}
                        className="px-3 py-1.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        Apply URL
                      </button>
                    </form>
                  </div>

                  {/* Document Status Toggles */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1 uppercase font-medium">
                        Verification Status Message
                      </label>
                      <input
                        type="text"
                        value={draft.profile.resume.comingSoonMessage}
                        onChange={(e) => {
                          setDraft({
                            ...draft,
                            profile: {
                              ...draft.profile,
                              resume: {
                                ...draft.profile.resume,
                                comingSoonMessage: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder="Verified curriculum vitae available to view and download."
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-secondary)]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-primary)] font-mono">
                        <input
                          type="checkbox"
                          checked={draft.profile.resume.isAvailable}
                          onChange={(e) => {
                            setDraft({
                              ...draft,
                              profile: {
                                ...draft.profile,
                                resume: {
                                  ...draft.profile.resume,
                                  isAvailable: e.target.checked,
                                },
                              },
                            });
                          }}
                          className="rounded border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--accent-secondary)] cursor-pointer"
                        />
                        <span>Mark Resume as Verified &amp; Active across Portfolio</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Status</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resume Version History Section */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-bold font-mono uppercase text-[var(--text-primary)]">
                    Resume Version History
                  </h3>
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {draft.profile.resume.versions?.length || 0} versions archived
                </span>
              </div>

              {draft.profile.resume.versions && draft.profile.resume.versions.length > 0 ? (
                <div className="space-y-3">
                  {draft.profile.resume.versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        version.isActive
                          ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/5'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-md shrink-0 ${
                            version.isActive
                              ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                              : 'bg-[var(--surface-elevated)] text-[var(--text-muted)]'
                          }`}
                        >
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                              {version.fileName}
                            </span>
                            {version.isActive && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--color-success)] text-[var(--bg-primary)] font-bold uppercase">
                                Active Published
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                            <span>Uploaded: {version.uploadedAt}</span>
                            <span>·</span>
                            <span>{version.fileSize}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {!version.isActive && (
                          <button
                            type="button"
                            onClick={() => handleRollbackResume(version)}
                            disabled={isSavingResume}
                            className="px-2.5 py-1 rounded bg-[var(--surface-elevated)] hover:bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--accent-primary)] hover:border-[var(--accent-primary)] cursor-pointer"
                          >
                            Set Active (Rollback)
                          </button>
                        )}
                        <a
                          href={version.fileUrl || '/resume.pdf'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-[var(--surface-elevated)] hover:bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] cursor-pointer"
                        >
                          Preview
                        </a>
                        {!version.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeleteResumeVersion(version.id)}
                            disabled={isSavingResume}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                            title="Delete historical version"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs font-mono text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-lg">
                  No historical resume versions recorded yet. Uploading a new PDF creates an atomic version.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: PROFILE PHOTO SECTION */}
        {/* ============================================================= */}
        {activeTab === 'photo' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-primary)] uppercase">
                      PORTRAIT &amp; IDENTITY ASSETS
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      {draft.profile.photo.url && !draft.profile.photo.isPlaceholder
                        ? 'Custom Photo Active'
                        : 'Monogram Frame Active'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-mono uppercase">
                    Profile Photograph Management
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-2xl leading-relaxed">
                    Upload or update Sai Nithin Reddy&apos;s real portrait photo. Files are validated, stored persistently, mirrored to <code>/api/portfolio/photo</code> and <code>/images/profile-photo.*</code>, and automatically rendered in Hero and About sections.
                  </p>
                </div>

                {draft.profile.photo.url && !draft.profile.photo.isPlaceholder && (
                  <button
                    type="button"
                    onClick={handleResetPhoto}
                    disabled={isSavingPhoto}
                    className="px-3 py-1.5 rounded-sm bg-[var(--bg-secondary)] hover:border-[var(--color-danger)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--color-danger)] border border-[var(--border-subtle)] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Monogram</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Active Photo Live Preview */}
                <div className="md:col-span-5 flex flex-col items-center sm:items-start space-y-3">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
                    Current Portrait Display
                  </span>
                  <div className="w-full max-w-[260px] aspect-[4/5] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden flex items-center justify-center p-3 relative shadow-md">
                    {draft.profile.photo.url && !draft.profile.photo.isPlaceholder ? (
                      <img
                        src={draft.profile.photo.url}
                        alt={draft.profile.photo.altText || 'Portrait Preview'}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center select-none">
                        <div className="w-16 h-16 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-3">
                          <span className="font-mono text-2xl font-bold tracking-wider text-[var(--text-primary)]">
                            SNR
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                          Sai Nithin Reddy
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                          NEUTRAL MONOGRAM PLACEHOLDER
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    Endpoint: <code className="text-[var(--accent-primary)] font-bold">/api/portfolio/photo</code>
                  </span>
                </div>

                {/* Photo Upload & Settings */}
                <div className="md:col-span-7 space-y-6">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setPhotoDragOver(true);
                    }}
                    onDragLeave={() => setPhotoDragOver(false)}
                    onDrop={handlePhotoDrop}
                    className={`p-6 rounded-xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer ${
                      photoDragOver
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                        : 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)] bg-[var(--bg-secondary)]'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoFileInputChange}
                      className="hidden"
                    />
                    <div className="p-3 rounded-full bg-[var(--surface-elevated)] text-[var(--accent-primary)]">
                      {isSavingPhoto ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
                      ) : (
                        <Camera className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                        {isSavingPhoto ? 'Processing & Optimizing Image...' : 'Click to Upload or Drag & Drop Portrait'}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                        PNG, JPG, or WEBP (Max 4MB). Automatically framed and scaled.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSavingPhoto}
                      className="mt-1 px-4 py-1.5 rounded-sm bg-[var(--surface-elevated)] hover:bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] cursor-pointer"
                    >
                      Choose Image File
                    </button>
                  </div>

                  {/* Image URL fallback */}
                  <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] space-y-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span className="text-xs font-bold font-mono uppercase text-[var(--text-primary)]">
                        Or Provide Image URL
                      </span>
                    </div>
                    <form onSubmit={handleApplyPhotoUrl} className="flex gap-2">
                      <input
                        type="url"
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        placeholder="https://example.com/portrait.jpg"
                        className="flex-1 px-3 py-1.5 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
                      />
                      <button
                        type="submit"
                        disabled={isSavingPhoto || !photoUrlInput.trim()}
                        className="px-3 py-1.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        Apply URL
                      </button>
                    </form>
                  </div>

                  {/* Alt Text and Display Settings */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1 uppercase font-medium">
                        Accessibility Alt Text
                      </label>
                      <input
                        type="text"
                        value={draft.profile.photo.altText}
                        onChange={(e) => {
                          setDraft({
                            ...draft,
                            profile: {
                              ...draft.profile,
                              photo: {
                                ...draft.profile.photo,
                                altText: e.target.value,
                              },
                            },
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-primary)] font-mono">
                        <input
                          type="checkbox"
                          checked={draft.profile.photo.showInHero}
                          onChange={(e) => {
                            setDraft({
                              ...draft,
                              profile: {
                                ...draft.profile,
                                photo: {
                                  ...draft.profile.photo,
                                  showInHero: e.target.checked,
                                },
                              },
                            });
                          }}
                          className="rounded border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--accent-primary)] cursor-pointer"
                        />
                        <span>Show Portrait in Hero Section</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-primary)] font-mono">
                        <input
                          type="checkbox"
                          checked={draft.profile.photo.showInAbout}
                          onChange={(e) => {
                            setDraft({
                              ...draft,
                              profile: {
                                ...draft.profile,
                                photo: {
                                  ...draft.profile.photo,
                                  showInAbout: e.target.checked,
                                },
                              },
                            });
                          }}
                          className="rounded border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--accent-primary)] cursor-pointer"
                        />
                        <span>Show Portrait in About Section Sidebar</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Photograph Settings</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Version Gallery Section */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-bold font-mono uppercase text-[var(--text-primary)]">
                    Portrait Version Gallery
                  </h3>
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {draft.profile.photo.versions?.length || 0} portraits archived
                </span>
              </div>

              {draft.profile.photo.versions && draft.profile.photo.versions.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {draft.profile.photo.versions.map((ver) => (
                    <div
                      key={ver.id}
                      className={`rounded-lg border p-2 flex flex-col justify-between space-y-2 relative transition-all ${
                        ver.isActive
                          ? 'border-[var(--color-success)] bg-[var(--color-success)]/5 ring-1 ring-[var(--color-success)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <div className="aspect-square rounded overflow-hidden bg-[var(--surface-card)] flex items-center justify-center relative">
                        <img
                          src={ver.url}
                          alt={ver.fileName}
                          className="w-full h-full object-cover"
                        />
                        {ver.isActive && (
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-[var(--color-success)] text-[var(--bg-primary)] text-[9px] font-mono font-bold uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono truncate">
                        <span className="block text-[var(--text-primary)] font-semibold truncate">
                          {ver.fileName}
                        </span>
                        <span className="text-[var(--text-muted)]">{ver.uploadedAt}</span>
                      </div>
                      <div className="flex items-center gap-1 pt-1 border-t border-[var(--border-subtle)]">
                        {!ver.isActive && (
                          <button
                            type="button"
                            onClick={() => handleRollbackPhoto(ver)}
                            disabled={isSavingPhoto}
                            className="flex-1 py-1 rounded bg-[var(--surface-elevated)] hover:bg-[var(--surface-card)] text-[10px] font-mono text-[var(--accent-primary)] text-center cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                        {!ver.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeletePhotoVersion(ver.id)}
                            disabled={isSavingPhoto}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs font-mono text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-lg">
                  No historical portrait versions archived. Uploading photos will populate this gallery.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: PROJECTS ARCHIVE */}
        {/* ============================================================= */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] font-mono uppercase">
                  Project Catalog Management
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Manage engineering projects, case study connections, and repository links.
                </p>
              </div>
              {!isAddingProject && !editingProject && (
                <button
                  type="button"
                  onClick={() => setIsAddingProject(true)}
                  className="px-3.5 py-1.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>+ Add Project</span>
                </button>
              )}
            </div>

            {isAddingProject && (
              <ProjectForm
                mode="add"
                onSave={handleSaveNewProject}
                onCancel={() => setIsAddingProject(false)}
              />
            )}

            {editingProject && (
              <ProjectForm
                mode="edit"
                initialProject={editingProject}
                onSave={handleUpdateProject}
                onCancel={() => setEditingProject(null)}
              />
            )}

            {!isAddingProject && !editingProject && (
              <div className="grid grid-cols-1 gap-3">
                {draft.projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text-primary)]">
                          {project.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--accent-primary)] uppercase">
                          {project.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl">
                        {project.tagline || project.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingProject(project)}
                        className="px-3 py-1.5 rounded bg-[var(--surface-elevated)] hover:bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingProject(project)}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: GITHUB SYNC */}
        {/* ============================================================= */}
        {activeTab === 'github' && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-6">
            <div className="border-b border-[var(--border-subtle)] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] font-mono uppercase">
                  GitHub Repository Synchronization
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Discover repositories tagged with <code>portfolio</code> on <code>sainithinreddy06</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setIsSyncingGithub(true);
                  try {
                    const res = await authFetch('/api/github/sync', { method: 'POST' });
                    const data = await readApiJson(res);
                    setGithubSyncMsg(data.message || 'Repositories synced successfully.');
                    await fetchDiagnostics();
                  } catch (err: any) {
                    setErrorMessage(err.message || 'Failed to sync GitHub repositories.');
                  } finally {
                    setIsSyncingGithub(false);
                  }
                }}
                disabled={isSyncingGithub}
                className="px-4 py-2 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs font-semibold uppercase flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGithub ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>

            {githubSyncMsg && (
              <div className="p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-xs text-[var(--color-success)]">
                {githubSyncMsg}
              </div>
            )}

            {diagnostics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Rate Limit</span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    {diagnostics.rateLimitRemaining ?? 'Active'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Discovered Repos</span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    {diagnostics.totalReposDiscovered ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Eligible Repos</span>
                  <span className="font-bold text-sm text-[var(--color-success)]">
                    {diagnostics.eligibleReposCount ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Last Synced</span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    {diagnostics.lastSyncedAt ? new Date(diagnostics.lastSyncedAt).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: PROFILE DATA */}
        {/* ============================================================= */}
        {activeTab === 'profile' && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] font-mono uppercase">
                Profile &amp; Academic Identity
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Degree: Computer Science &amp; Engineering at Chaitanya Bharathi Institute of Technology (CBIT).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1 uppercase">
                  Display Name
                </label>
                <input
                  type="text"
                  value={draft.profile.name}
                  onChange={(e) =>
                    setDraft({ ...draft, profile: { ...draft.profile, name: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1 uppercase">
                  Wordmark
                </label>
                <input
                  type="text"
                  value={draft.profile.wordmark}
                  onChange={(e) =>
                    setDraft({ ...draft, profile: { ...draft.profile, wordmark: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs font-semibold cursor-pointer"
            >
              Save Profile Data
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 6: BACKUP & EXPORT */}
        {/* ============================================================= */}
        {activeTab === 'export' && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] font-mono uppercase">
                Backup, Export &amp; Reset
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Export current portfolio configuration and version metadata as JSON, or reset to baseline defaults.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-4 py-2 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono uppercase font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Backup</span>
              </button>
              <button
                type="button"
                onClick={handleResetStore}
                className="px-4 py-2 rounded-sm border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-xs font-mono uppercase cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Store to Defaults</span>
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal for Projects */}
        {deletingProject && (
          <ProjectConfirmation
            isOpen={Boolean(deletingProject)}
            type="DELETE"
            projectName={deletingProject.name}
            onConfirm={() => handleDeleteProject(deletingProject)}
            onCancel={() => setDeletingProject(null)}
          />
        )}

        {/* In-App Resume PDF Preview Modal */}
        {resumePreviewOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Resume PDF Preview"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setResumePreviewOpen(false)}
          >
            <div
              className="w-full max-w-4xl h-[85vh] bg-[var(--bg-primary)] border border-[var(--border-card)] rounded-xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase">
                    Active Resume Document Preview (/resume.pdf)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-[var(--surface-elevated)] hover:border-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3 text-[var(--accent-primary)]" />
                    <span>Open in Tab</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadResume(draft)}
                    className="px-2.5 py-1 rounded bg-[var(--surface-elevated)] hover:border-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-[var(--color-success)]" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumePreviewOpen(false)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-black/5 relative">
                <iframe
                  src="/resume.pdf"
                  title="Resume PDF Preview"
                  className="w-full h-full border-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
