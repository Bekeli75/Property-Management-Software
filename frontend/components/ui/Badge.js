import { Fragment } from 'react';

const variants = {
  teal: 'badge-teal',
  emerald: 'badge-emerald',
  amber: 'badge-amber',
  red: 'badge-red',
  blue: 'badge-blue',
  slate: 'badge-slate',
};

const statusMap = {
  active: 'emerald',
  available: 'emerald',
  completed: 'emerald',
  paid: 'emerald',
  occupied: 'blue',
  in_progress: 'blue',
  pending: 'amber',
  pending_termination: 'amber',
  urgent: 'red',
  high: 'amber',
  terminated: 'red',
  cancelled: 'red',
  failed: 'red',
  blacklisted: 'red',
  expired: 'slate',
  inactive: 'slate',
  draft: 'slate',
  archive: 'slate',
  archived: 'slate',
  refunded: 'blue',
  low: 'slate',
  medium: 'blue',
};

export default function Badge({ children, variant, status, className = '' }) {
  const resolvedVariant = variant || (status ? statusMap[status] : 'slate') || 'slate';

  return (
    <span className={`badge ${variants[resolvedVariant] || 'badge-slate'} ${className}`}>
      <Fragment>{children || status || resolvedVariant}</Fragment>
    </span>
  );
}
