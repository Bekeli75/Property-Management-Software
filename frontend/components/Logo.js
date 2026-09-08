'use client';

function LogoMark({ size = 32, variant = 'dark', className = '', glow = false }) {
  const fill = variant === 'light' ? '#ffffff' : '#14b8a6';
  const secondary = variant === 'light' ? 'rgba(255, 255, 255, 0.6)' : '#0f766e';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {glow && <circle cx="20" cy="20" r="19.5" fill="rgba(20, 184, 166, 0.12)" />}
      {/* Building / property outline */}
      <rect x="6" y="12" width="28" height="22" rx="2.5" stroke={fill} strokeWidth="2.6" />
      {/* Roof line */}
      <path d="M6 12L20 4L34 12" stroke={fill} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* P letterform formed by vertical bar + arch inside building */}
      <path d="M16 26V15" stroke={fill} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M16 15C20.5 14.5 25 16.5 25 20.5C25 24.5 20.5 26.5 16 26" stroke={fill} strokeWidth="2.8" strokeLinecap="round" />
      {/* Door detail */}
      <path d="M17 34V28" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
      <path d="M23 34V28" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ size = 'md', variant = 'dark', showTagline = true, markOnly = false, className = '' }) {
  const sizes = {
    sm: { mark: 28, compact: false },
    md: { mark: 34, compact: true },
    lg: { mark: 40, compact: true },
  };

  const config = sizes[size] || sizes.md;

  if (markOnly) {
    return <LogoMark size={config.mark} variant={variant} className={className} />;
  }

  const wordColor = variant === 'light' ? 'text-white' : 'text-slate-950';
  const taglineColor = variant === 'light' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={config.mark} variant={variant} />
      {config.compact && (
        <div className="leading-none">
          <p className={`text-lg font-bold uppercase tracking-[0.14em] ${wordColor}`}>
            Propentra
          </p>
          {showTagline && (
            <p className={`mt-1 text-[10px] font-medium tracking-[0.08em] ${taglineColor}`}>
              Property Intelligence &amp; Management
            </p>
          )}
        </div>
      )}
    </div>
  );
}