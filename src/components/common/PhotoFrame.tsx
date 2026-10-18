import React, { useEffect, useState } from 'react';
import { PhotoConfig } from '../../content/types';

interface PhotoFrameProps {
  photo: PhotoConfig;
  className?: string;
  size?: 'hero' | 'about' | 'compact';
  caption?: string;
  captionAlign?: 'left' | 'right' | 'center';
}

// Stable permanent default profile photo asset (user's uploaded portrait)
export const DEFAULT_PROFILE_PHOTO = '/images/default-profile.png';

export function processImageTransparency(sourceUrl: string, onProcessed: (url: string) => void) {
  if (!sourceUrl) {
    onProcessed('');
    return;
  }

  const img = new Image();
  if (!sourceUrl.startsWith('data:') && !sourceUrl.startsWith('/')) {
    img.crossOrigin = 'anonymous';
  }

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const w = Math.min(img.naturalWidth || img.width, 1200);
      const h = Math.min(img.naturalHeight || img.height, 1500);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        onProcessed(sourceUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const { data } = imgData;

      const corners = [
        0,
        (w - 1) * 4,
        (h - 1) * w * 4,
        ((h - 1) * w + (w - 1)) * 4,
      ];

      const isAlreadyTransparent = corners.some((idx) => data[idx + 3] < 10);
      if (isAlreadyTransparent) {
        onProcessed(sourceUrl);
        return;
      }

      const isCornerWhite = corners.some(
        (idx) => data[idx] > 230 && data[idx + 1] > 230 && data[idx + 2] > 230
      );

      if (!isCornerWhite) {
        onProcessed(sourceUrl);
        return;
      }

      const visited = new Uint8Array(w * h);
      const queue: number[] = [];

      const isWhitePixel = (idx: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        return a > 30 && r > 228 && g > 228 && b > 228;
      };

      for (let x = 0; x < w; x++) {
        const top = 0 * w + x;
        if (isWhitePixel(top * 4)) {
          queue.push(top);
          visited[top] = 1;
        }
        const bottom = (h - 1) * w + x;
        if (isWhitePixel(bottom * 4)) {
          queue.push(bottom);
          visited[bottom] = 1;
        }
      }

      for (let y = 0; y < h; y++) {
        const left = y * w + 0;
        if (!visited[left] && isWhitePixel(left * 4)) {
          queue.push(left);
          visited[left] = 1;
        }
        const right = y * w + (w - 1);
        if (!visited[right] && isWhitePixel(right * 4)) {
          queue.push(right);
          visited[right] = 1;
        }
      }

      let head = 0;
      while (head < queue.length) {
        const curr = queue[head++];
        const cx = curr % w;
        const cy = Math.floor(curr / w);
        const pixelIdx = curr * 4;

        data[pixelIdx + 3] = 0;

        const neighbors = [
          cx > 0 ? curr - 1 : -1,
          cx < w - 1 ? curr + 1 : -1,
          cy > 0 ? curr - w : -1,
          cy < h - 1 ? curr + w : -1,
        ];

        for (let i = 0; i < 4; i++) {
          const n = neighbors[i];
          if (n !== -1 && !visited[n]) {
            visited[n] = 1;
            const nIdx = n * 4;
            const r = data[nIdx];
            const g = data[nIdx + 1];
            const b = data[nIdx + 2];
            if (r > 220 && g > 220 && b > 220) {
              queue.push(n);
            } else if (r > 195 && g > 195 && b > 195) {
              const avg = (r + g + b) / 3;
              const alphaFactor = Math.max(0, Math.min(1, (230 - avg) / 35));
              data[nIdx + 3] = Math.round(data[nIdx + 3] * alphaFactor);
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      onProcessed(canvas.toDataURL('image/png'));
    } catch {
      onProcessed(sourceUrl);
    }
  };

  img.onerror = () => {
    onProcessed(sourceUrl);
  };
  img.src = sourceUrl;
}

export const PhotoFrame: React.FC<PhotoFrameProps> = ({
  photo,
  className = '',
  size = 'hero',
  caption = 'SAI NITHIN REDDY',
  captionAlign = 'center',
}) => {
  // Determine primary candidate image:
  // Use configured photo.url if not explicitly a placeholder, otherwise use DEFAULT_PROFILE_PHOTO
  const configuredUrl = photo.url && !photo.isPlaceholder ? photo.url : DEFAULT_PROFILE_PHOTO;
  const [activeUrl, setActiveUrl] = useState<string>(configuredUrl);
  const [processedUrl, setProcessedUrl] = useState<string>(configuredUrl);
  const [fallbackAttempted, setFallbackAttempted] = useState<boolean>(false);
  const [isCompletelyFailed, setIsCompletelyFailed] = useState<boolean>(false);

  const containerAlign = {
    left: 'items-start',
    right: 'items-end',
    center: 'items-center',
  }[captionAlign];

  const textAlign = {
    left: 'text-left pl-0.5',
    right: 'text-right pr-0.5',
    center: 'text-center',
  }[captionAlign];

  // Synchronize when photo configuration changes
  useEffect(() => {
    const nextUrl = photo.url && !photo.isPlaceholder ? photo.url : DEFAULT_PROFILE_PHOTO;
    setActiveUrl(nextUrl);
    setProcessedUrl(nextUrl);
    setFallbackAttempted(false);
    setIsCompletelyFailed(false);

    processImageTransparency(nextUrl, (transparentUrl) => {
      if (transparentUrl) {
        setProcessedUrl(transparentUrl);
      }
    });
  }, [photo.url, photo.isPlaceholder]);

  // Handle image load error: fall back to DEFAULT_PROFILE_PHOTO before showing monogram
  const handleImageError = () => {
    if (!fallbackAttempted && activeUrl !== DEFAULT_PROFILE_PHOTO) {
      setFallbackAttempted(true);
      setActiveUrl(DEFAULT_PROFILE_PHOTO);
      setProcessedUrl(DEFAULT_PROFILE_PHOTO);
      processImageTransparency(DEFAULT_PROFILE_PHOTO, (transparentUrl) => {
        if (transparentUrl) {
          setProcessedUrl(transparentUrl);
        }
      });
    } else {
      setIsCompletelyFailed(true);
    }
  };

  const sizeClasses = {
    hero: 'w-full max-w-[280px] sm:max-w-[340px]',
    about: 'w-full max-w-[240px]',
    compact: 'w-24',
  }[size];

  // Render the photo (primary or fallback default)
  if (!isCompletelyFailed) {
    return (
      <div
        className={`inline-flex flex-col ${containerAlign} w-fit mx-auto md:ml-auto md:mr-0 select-none ${className}`}
      >
        <div
          className="relative inline-block cursor-default"
          aria-label={photo.altText || 'Portrait of Sai Nithin Reddy'}
        >
          <img
            src={processedUrl || activeUrl}
            alt={photo.altText || 'Portrait of Sai Nithin Reddy'}
            onError={handleImageError}
            className="max-h-[360px] sm:max-h-[430px] w-auto max-w-[280px] sm:max-w-[340px] object-contain object-bottom drop-shadow-sm transition-all duration-300 block select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </div>
        {caption && (
          <div className={`w-full ${textAlign} mt-2 flex items-center justify-center gap-1.5`}>
            <span className="font-mono text-[11px] sm:text-xs tracking-widest text-[var(--text-secondary)] uppercase select-none">
              {caption}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Graceful fallback monogram (only if both primary and local default photo fail)
  return (
    <div
      className={`flex flex-col ${containerAlign} ${sizeClasses} select-none ${className}`}
    >
      <div
        className="w-full aspect-[4/5] relative bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl shadow-xs flex items-center justify-center transition-all duration-200 cursor-default"
        aria-label={photo.altText || 'Portrait placeholder for Sai Nithin Reddy'}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
          <div className="w-16 h-16 rounded-xl bg-[var(--surface-elevated)]/60 border border-[var(--border-subtle)] flex items-center justify-center mb-3 shadow-inner transition-colors">
            <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-[var(--text-primary)]">
              SNR
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--text-primary)] font-bold">
              Sai Nithin Reddy
            </p>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              CBIT CSE · 2024 – 2028
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] w-full flex items-center justify-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)]/80" />
            <span>PORTFOLIO IDENTITY</span>
          </div>
        </div>
      </div>
      {caption && (
        <div className={`w-full ${textAlign} mt-2`}>
          <span className="font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase select-none">
            {caption}
          </span>
        </div>
      )}
    </div>
  );
};
