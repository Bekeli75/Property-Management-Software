export default function Logo({ size = 'md' }) {
  const sizeClasses = {
    sm: { mark: 'h-8 w-8', name: 'text-lg', tagline: 'text-[0.5rem]' },
    md: { mark: 'h-10 w-10', name: 'text-xl', tagline: 'text-[0.55rem]' },
    lg: { mark: 'h-14 w-14', name: 'text-2xl', tagline: 'text-[0.6rem]' },
  };
  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center gap-2" aria-label="Propentra">
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-slate-900 ${currentSize.mark}`}>
        <svg viewBox="0 0 48 48" className="h-[78%] w-[78%]" aria-hidden="true">
          <path
            d="M8 22 24 9l16 13v16a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V22Z"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M19 36V20h7.5a5 5 0 0 1 0 10H19m0-5h7"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={`${currentSize.name} font-bold leading-none tracking-tight`}>
          <span className="text-blue-900">PROP</span>
          <span className="text-teal-600">ENTRA</span>
        </span>
        <span className={`${currentSize.tagline} text-blue-900 font-medium tracking-[0.08em]`}>
          PROPERTY MANAGEMENT SOFTWARE
        </span>
      </div>
    </div>
  );
}
