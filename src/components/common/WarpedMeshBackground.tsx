import React, { useMemo } from 'react';

interface WarpedMeshBackgroundProps {
  className?: string;
  opacity?: number;
}

interface MeshPoint {
  x: number;
  y: number;
}

interface MeshPathData {
  d: string;
  isAccent: boolean;
}

function pointsToSplinePath(points: MeshPoint[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = Number((p1.x + (p2.x - p0.x) / 6).toFixed(1));
    const cp1y = Number((p1.y + (p2.y - p0.y) / 6).toFixed(1));
    const cp2x = Number((p2.x - (p3.x - p1.x) / 6).toFixed(1));
    const cp2y = Number((p2.y - (p3.y - p1.y) / 6).toFixed(1));
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function computeWarpedMeshGeometry(
  width = 1440,
  height = 900,
  cols = 28,
  rows = 20
): { rowPaths: MeshPathData[]; colPaths: MeshPathData[] } {
  const grid: MeshPoint[][] = [];
  for (let j = 0; j <= rows; j++) {
    const row: MeshPoint[] = [];
    const v = j / rows;
    const depth = Math.pow(v, 1.16);
    const yBaseline = -40 + depth * (height + 100);
    const angleShift = (1 - v) * 150;

    for (let i = 0; i <= cols; i++) {
      const u = i / cols;
      const uCurved = 1 - Math.pow(1 - u, 1.25);
      const xBase = -80 + uCurved * (width + 240);

      const surfaceWave = Math.sin(u * Math.PI * 0.95 + 0.15) * Math.sin(v * Math.PI * 0.9 + 0.1);
      const archCamber = Math.sin(u * Math.PI) * 44;
      const twist = (u - 0.45) * (v - 0.5) * 85;
      const sag = Math.sin(v * Math.PI * 1.1) * 30;
      const x = Number((xBase + angleShift + Math.cos(v * Math.PI * 1.15) * 22 + twist * 0.28).toFixed(1));
      const y = Number((yBaseline + surfaceWave * 52 - archCamber * 0.38 + twist * 0.45 + sag).toFixed(1));
      row.push({ x, y });
    }
    grid.push(row);
  }

  const rowPaths: MeshPathData[] = grid.map((r, idx) => ({
    d: pointsToSplinePath(r),
    isAccent: idx % 4 === 0,
  }));

  const colPaths: MeshPathData[] = [];
  for (let i = 0; i <= cols; i++) {
    const pts: MeshPoint[] = [];
    for (let j = 0; j <= rows; j++) {
      pts.push(grid[j][i]);
    }
    colPaths.push({
      d: pointsToSplinePath(pts),
      isAccent: i % 4 === 0,
    });
  }

  return { rowPaths, colPaths };
}

export const WarpedMeshBackground: React.FC<WarpedMeshBackgroundProps> = ({
  className = '',
  opacity = 1,
}) => {
  const { rowPaths, colPaths } = useMemo(() => computeWarpedMeshGeometry(), []);

  return (
    <div
      aria-hidden="true"
      style={{ opacity }}
      className={`pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="mesh-edge-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
            <stop offset="8%" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="mesh-text-negative-space" cx="26%" cy="45%" r="42%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#000" stopOpacity="0.45" />
            <stop offset="85%" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fff" stopOpacity="1" />
          </radialGradient>
          <mask id="hero-mesh-composite-mask">
            <rect width="1440" height="900" fill="white" />
            <rect width="1440" height="900" fill="url(#mesh-edge-fade)" />
            <circle cx="360" cy="400" r="420" fill="url(#mesh-text-negative-space)" />
            <ellipse cx="1120" cy="420" rx="220" ry="320" fill="black" opacity="0.25" />
          </mask>
        </defs>
        <g mask="url(#hero-mesh-composite-mask)">
          {rowPaths.map((p, idx) => (
            <path
              key={`row-${idx}`}
              d={p.d}
              stroke={p.isAccent ? 'var(--mesh-line-accent)' : 'var(--mesh-line-base)'}
              strokeWidth={p.isAccent ? 1.2 : 0.75}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {colPaths.map((p, idx) => (
            <path
              key={`col-${idx}`}
              d={p.d}
              stroke={p.isAccent ? 'var(--mesh-line-accent)' : 'var(--mesh-line-base)'}
              strokeWidth={p.isAccent ? 1.2 : 0.75}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
