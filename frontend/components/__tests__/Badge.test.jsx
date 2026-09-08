import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders a status label when no children are given', () => {
    render(<Badge status="paid" />);
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  it('prefers children over the status label', () => {
    render(<Badge status="paid">Received</Badge>);
    expect(screen.getByText('Received')).toBeInTheDocument();
    expect(screen.queryByText('paid')).not.toBeInTheDocument();
  });

  it('maps known statuses to the right variant class', () => {
    const { container } = render(<Badge status="available" />);
    expect(container.querySelector('.badge').className).toContain('badge-emerald');
  });

  it('falls back to slate for unknown statuses', () => {
    const { container } = render(<Badge status="maintenance" />);
    expect(container.querySelector('.badge').className).toContain('badge-slate');
  });

  it('honors an explicit variant prop over the status map', () => {
    const { container } = render(<Badge status="available" variant="amber" />);
    expect(container.querySelector('.badge').className).toContain('badge-amber');
  });
});