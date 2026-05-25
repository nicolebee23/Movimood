import React from 'react';

// Shared SVG props
const SVG_SIZE = 28;
const commonProps = {
  width: SVG_SIZE,
  height: SVG_SIZE,
  viewBox: '0 0 28 28',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function GlowDefs({ id }) {
  return (
    <defs>
      <filter id={id} x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

export function SadIcon({ className }) {
  const stroke = '#b44fff';
  const glowId = 'glow-sad';
  return (
    <svg {...commonProps} className={className} aria-hidden="true">
      <GlowDefs id={glowId} />
      {/* glow layer */}
      <g filter={`url(#${glowId})`} stroke={stroke} strokeWidth="3" opacity="0.32" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="14" cy="14" r="9" />
        <path d="M10.5 18c1.2-1.4 3.6-1.4 4.8 0" strokeLinecap="round" />
        <path d="M10 12.5h.01M18 12.5h.01" />
      </g>

      {/* main stroke */}
      <g stroke={stroke} strokeWidth="1.6">
        <circle cx="14" cy="14" r="9" />
        <path d="M10.5 18c1.2-1.4 3.6-1.4 4.8 0" strokeLinecap="round" />
        <path d="M10 12.5h.01M18 12.5h.01" />
      </g>
    </svg>
  );
}

export function NostalgicIcon({ className }) {
  const stroke = '#ff8a3d';
  const glowId = 'glow-nostalgic';
  return (
    <svg {...commonProps} className={className} aria-hidden="true">
      <GlowDefs id={glowId} />
      <g filter={`url(#${glowId})`} stroke={stroke} strokeWidth="3" opacity="0.28">
        <path d="M8 5h12v2L14 13 8 7V5zM8 23h12v-2l-6-6-6 6v2z" />
      </g>
      <g stroke={stroke} strokeWidth="1.6">
        <path d="M8 5h12v2L14 13 8 7V5zM8 23h12v-2l-6-6-6 6v2z" />
      </g>
    </svg>
  );
}

export function RelaxedIcon({ className }) {
  const stroke = '#4fb3ff';
  const glowId = 'glow-relaxed';
  return (
    <svg {...commonProps} className={className} aria-hidden="true">
      <GlowDefs id={glowId} />
      <g filter={`url(#${glowId})`} stroke={stroke} strokeWidth="3" opacity="0.28">
        <path d="M6 15a4 4 0 0 1 4-4h.8a5 5 0 1 1 8.4 4H6z" />
      </g>
      <g stroke={stroke} strokeWidth="1.6">
        <path d="M6 15a4 4 0 0 1 4-4h.8a5 5 0 1 1 8.4 4H6z" />
      </g>
    </svg>
  );
}

export function AnxiousIcon({ className }) {
  const stroke = '#2ea6ff';
  const glowId = 'glow-anxious';
  return (
    <svg {...commonProps} className={className} aria-hidden="true">
      <GlowDefs id={glowId} />
      <g filter={`url(#${glowId})`} stroke={stroke} strokeWidth="3" opacity="0.28">
        <circle cx="14" cy="14" r="9" />
        <path d="M9.5 11.5c1.2-.8 2.8-.8 4 .0" strokeLinecap="round" />
        <path d="M9 17s1-1.8 5-1.8 5 1.8 5 1.8" strokeLinecap="round" />
      </g>
      <g stroke={stroke} strokeWidth="1.6">
        <circle cx="14" cy="14" r="9" />
        <path d="M9.5 11.5c1.2-.8 2.8-.8 4 .0" strokeLinecap="round" />
        <path d="M9 17s1-1.8 5-1.8 5 1.8 5 1.8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function HappyIcon({ className }) {
  const stroke = '#3ee69a';
  const glowId = 'glow-happy';
  return (
    <svg {...commonProps} className={className} aria-hidden="true">
      <GlowDefs id={glowId} />
      <g filter={`url(#${glowId})`} stroke={stroke} strokeWidth="3" opacity="0.3">
        <circle cx="14" cy="14" r="9" />
        <path d="M9 12.5c1.2-1.6 4-1.6 6 0" strokeLinecap="round" />
      </g>
      <g stroke={stroke} strokeWidth="1.6">
        <circle cx="14" cy="14" r="9" />
        <path d="M9 12.5c1.2-1.6 4-1.6 6 0" strokeLinecap="round" />
        <path d="M10 11h.01M18 11h.01" />
      </g>
    </svg>
  );
}

export function MotivatedIcon({ className }) {
  const stroke = '#ff7a2d';
  const glowId = 'glow-motivated';
  return (
    <svg {...commonProps} className={className} aria-hidden="true">
      <GlowDefs id={glowId} />
      <g filter={`url(#${glowId})`} stroke={stroke} strokeWidth="3" opacity="0.3">
        <path d="M14 5s-4 3-4 7c0 4 4 6 4 6s4-2 4-6c0-4-4-7-4-7z" />
      </g>
      <g stroke={stroke} strokeWidth="1.6">
        <path d="M14 5s-4 3-4 7c0 4 4 6 4 6s4-2 4-6c0-4-4-7-4-7z" />
      </g>
    </svg>
  );
}

export function AngryIcon({ className }) {
  const stroke = '#ffcf3d';
  const glowId = 'glow-angry';
  return (
    <svg {...commonProps} className={className} aria-hidden="true">
      <GlowDefs id={glowId} />
      <g filter={`url(#${glowId})`} stroke={stroke} strokeWidth="3" opacity="0.32">
        <circle cx="14" cy="14" r="9" />
        <path d="M9 11l2-1.5M19 11l-2-1.5" strokeLinecap="round" />
        <path d="M10 18s1.5-2 4-2 4 2 4 2" strokeLinecap="round" />
      </g>
      <g stroke={stroke} strokeWidth="1.6">
        <circle cx="14" cy="14" r="9" />
        <path d="M9 11l2-1.5M19 11l-2-1.5" strokeLinecap="round" />
        <path d="M10 18s1.5-2 4-2 4 2 4 2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function EmotionalIcon({ className }) {
  const stroke = '#ff6fb0';
  const glowId = 'glow-emotional';
  return (
    <svg {...commonProps} className={className} aria-hidden="true">
      <GlowDefs id={glowId} />
      <g filter={`url(#${glowId})`} stroke={stroke} strokeWidth="3" opacity="0.32">
        <circle cx="14" cy="14" r="9" />
        <path d="M9.2 11.5c.6-.8 2-1.6 3.8-.2 1.8-1.4 3.2-.6 3.8.2" strokeLinecap="round" />
        <path d="M10 17s1-1.6 4-1.6 4 1.6 4 1.6" strokeLinecap="round" />
        {/* heart eyes */}
        <path d="M9 9.6c-.6-.8-1.8-.8-2.4 0C6 10.3 6 11 7 11c1 0 1.4-.4 2-1.4zM21 9.6c.6-.8 1.8-.8 2.4 0 .6.7.6 1.4-.4 1.4-1 0-1.4-.4-2-1.4z" />
      </g>
      <g stroke={stroke} strokeWidth="1.6" fill="none">
        <circle cx="14" cy="14" r="9" />
        <path d="M9.2 11.5c.6-.8 2-1.6 3.8-.2 1.8-1.4 3.2-.6 3.8.2" strokeLinecap="round" />
        <path d="M10 17s1-1.6 4-1.6 4 1.6 4 1.6" strokeLinecap="round" />
        <path d="M9 9.6c-.6-.8-1.8-.8-2.4 0C6 10.3 6 11 7 11c1 0 1.4-.4 2-1.4zM21 9.6c.6-.8 1.8-.8 2.4 0 .6.7.6 1.4-.4 1.4-1 0-1.4-.4-2-1.4z" />
      </g>
    </svg>
  );
}

export default SadIcon;
