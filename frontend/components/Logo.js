'use client';

function LogoMark({ size = 32, variant = 'dark', className = '', glow = false }) {
  const text = variant === 'light' ? '#ffffff' : '#0d9488';
  const accent = variant === 'light' ? '#5eead4' : '#14b8a6';
  const soft = variant === 'light' ? 'rgba(255,255,255,0.9)' : '#ffffff';
  const bg = variant === 'light' ? 'rgba(255,255,255,0.10)' : 'rgba(13,148,136,0.10)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {glow && <circle cx="24" cy="24" r="23.5" fill={bg} />}
      <defs>
        <linearGradient id="pms-mark-grad" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>

      {/* Premium rounded badge */}
      <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#pms-mark-grad)" />

      {/* Roof slab across the top (building roof = top of the P) */}
      <rect x="10" y="8.5" width="26" height="5.5" rx="1.8" fill={soft} />

      {/* Tower — the vertical stroke of the P */}
      <rect x="13" y="13.5" width="7" height="26" rx="2" fill={soft} />

      {/* Tower windows */}
      <rect x="14.8" y="17" width="2" height="3" rx="0.6" fill={accent} />
      <rect x="17.8" y="17" width="2" height="3" rx="0.6" fill={accent} />
      <rect x="14.8" y="21.5" width="2" height="3" rx="0.6" fill={accent} />
      <rect x="17.8" y="21.5" width="2" height="3" rx="0.6" fill={accent} />
      <rect x="14.8" y="26" width="2" height="3" rx="0.6" fill={accent} />
      <rect x="17.8" y="26" width="2" height="3" rx="0.6" fill={accent} />

      {/* Entrance door */}
      <rect x="16" y="35" width="3.2" height="4.5" rx="0.9" fill={accent} />

      {/* P bowl — curved building front */}
      <path
        d="M20 15.5 C28 14.8 33.5 19.4 33.5 23 C33.5 27.6 28.2 30.6 20 30.4"
        stroke={soft}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Ground line */}
      <line x1="9" y1="41" x2="35" y2="41" stroke={soft} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export default function Logo({ size = 'md', variant = 'dark', showTagline = true, markOnly = false, className = '' }) {
  const sizes = {
    sm: { mark: 26, compact: false },
    md: { mark: 34, compact: true },
    lg: { mark: 42, compact: true },
  };

  const config = sizes[size] || sizes.md;

  if (markOnly) {
    return <LogoMark size={config.mark} variant={variant} className={className} />;
  }

  const wordColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const taglineColor = variant === 'light' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={config.mark} variant={variant} />
      {config.compact && (
        <div className="leading-none">
          <p className={`text-base font-bold tracking-[0.08em] ${wordColor}`}>
            Propentra
          </p>
          {showTagline && (
            <p className={`mt-1 text-[9px] font-medium tracking-[0.08em] ${taglineColor}`}>
              Property Management Software
            </p>
          )}
        </div>
      )}
    </div>
  );
}