import type { CSSProperties } from 'react';

export function Flower({ color = '#fff7dc', center = '#f4c166', size = 72, className = '' }: {
  color?: string; center?: string; size?: number; className?: string;
}) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ '--petal': color, '--middle': center } as CSSProperties}>
      <g fill="var(--petal)" stroke="rgba(65,88,50,.14)" strokeWidth="1.2">
        {Array.from({ length: 6 }, (_, index) => (
          <ellipse key={index} cx="50" cy="25" rx="14" ry="23" transform={`rotate(${index * 60} 50 50)`} />
        ))}
      </g>
      <circle cx="50" cy="50" r="12" fill="var(--middle)" />
      <circle cx="46" cy="46" r="2" fill="rgba(255,255,255,.7)" />
      <circle cx="54" cy="53" r="1.7" fill="rgba(255,255,255,.6)" />
    </svg>
  );
}
