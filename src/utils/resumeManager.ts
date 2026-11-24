import { serverResourceUrl } from '../services/apiResponse';
import { PortfolioContent } from '../content/types';

/**
 * Resolves the primary URL for the uploaded resume PDF.
 * Checks for:
 * 1. An explicitly configured fileUrl (data URI, HTTP/HTTPS URL, or /resume.pdf).
 * 2. Defaults to '/resume.pdf' (static asset in public folder for Netlify & Vite).
 */
export function getResumeFileUrl(content?: PortfolioContent): string {
  const resume = content?.profile?.resume;
  if (resume?.fileUrl && resume.fileUrl !== '#resume-view' && resume.fileUrl.trim().length > 0) {
    return serverResourceUrl(resume.fileUrl);
  }
  return serverResourceUrl('/resume.pdf');
}

/**
 * Downloads the actual uploaded resume PDF.
 * Completely eliminates any dynamic jsPDF synthesis or Blob generation.
 */
export async function downloadResume(content: PortfolioContent): Promise<void> {
  const fileUrl = getResumeFileUrl(content);
  const preferredFilename = content.profile.resume.fileName || 'Sai_Nithin_Reddy_Resume.pdf';

  const anchor = document.createElement('a');
  anchor.href = fileUrl;
  anchor.download = preferredFilename;
  anchor.rel = 'noopener noreferrer';
  let objectUrl: string | undefined;
  try {
    const response = await fetch(fileUrl);
    if (response.ok) {
      objectUrl = URL.createObjectURL(await response.blob());
      anchor.href = objectUrl;
    }
  } catch { /* A remote host may only permit a direct download. */ }
  if (!objectUrl) anchor.target = '_blank';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
