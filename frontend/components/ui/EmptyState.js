export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`card flex flex-col items-center justify-center px-8 py-14 text-center ${className}`}>
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <Icon size={28} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn btn-primary mt-6">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
