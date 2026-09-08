export default function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <div className={`flex flex-col justify-between gap-4 sm:flex-row sm:items-end ${className}`}>
      <div>
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
