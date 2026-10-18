import { PortfolioContent, ResumeConfig } from '../content/types';

/**
 * Resolves the primary URL for the uploaded resume PDF.
 * Checks for:
 * 1. An explicitly configured fileUrl (data URI, HTTP/HTTPS URL, or /resume.pdf).
 * 2. Defaults to '/resume.pdf' (static asset in public folder for Netlify & Vite).
 */
export function getResumeFileUrl(content?: PortfolioContent): string {
  const resume = content?.profile?.resume;
  if (resume?.fileUrl && resume.fileUrl !== '#resume-view' && resume.fileUrl.trim().length > 0) {
    if (resume.fileUrl.startsWith('http://') || resume.fileUrl.startsWith('https://')) {
      return resume.fileUrl;
    }
    return resume.fileUrl;
  }
  return '/resume.pdf';
}

/**
 * Downloads the actual uploaded resume PDF.
 * Completely eliminates any dynamic jsPDF synthesis or Blob generation.
 */
export async function downloadResume(content: PortfolioContent): Promise<void> {
  const fileUrl = getResumeFileUrl(content);
  const preferredFilename = content.profile.resume.fileName || 'Sai_Nithin_Reddy_Resume.pdf';

  try {
    // If it's a data URL or blob, download directly via anchor
    if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = preferredFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Try fetching the file as a Blob to enforce the exact download filename
    const res = await fetch(fileUrl);
    if (!res.ok) {
      // If direct fetch fails (e.g. CORS or 404), fall back to opening or downloading via window/anchor
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = preferredFilename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = preferredFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    // Fallback: direct navigation download
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = preferredFilename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Opens the actual uploaded resume PDF in a new browser tab.
 */
export function viewResume(content: PortfolioContent): void {
  const fileUrl = getResumeFileUrl(content);
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Processes a resume upload and updates portfolio state.
 */
export function processResumeUpload(
  file: File,
  currentContent: PortfolioContent,
  onSave: (updated: PortfolioContent) => void,
  onError?: (msg: string) => void
): void {
  if (file.size > 15 * 1024 * 1024) {
    if (onError) onError('File size exceeds 15MB limit. Please upload a smaller PDF.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    if (!dataUrl) return;
    const sizeFormatted =
      file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const updatedResume: ResumeConfig = {
      fileUrl: '/resume.pdf',
      fileName: file.name || 'Sai_Nithin_Reddy_Resume.pdf',
      fileSize: sizeFormatted,
      uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      isAvailable: true,
      comingSoonMessage: 'Verified custom resume uploaded and active.',
    };
    const updatedContent: PortfolioContent = {
      ...currentContent,
      profile: {
        ...currentContent.profile,
        resume: updatedResume,
      },
    };
    onSave(updatedContent);
  };
  reader.onerror = () => {
    if (onError) onError('Failed to read file. Please try again.');
  };
  reader.readAsDataURL(file);
}
