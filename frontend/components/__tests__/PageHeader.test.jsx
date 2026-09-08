import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageHeader from '@/components/ui/PageHeader';

describe('PageHeader', () => {
  it('renders eyebrow, title, and description', () => {
    render(<PageHeader eyebrow="Management" title="All leases" description="Keep agreements organized." />);
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'All leases' })).toBeInTheDocument();
    expect(screen.getByText('Keep agreements organized.')).toBeInTheDocument();
  });

  it('renders actions', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PageHeader title="Leases" actions={<button type="button" onClick={onClick}>Create lease</button>} />);
    await user.click(screen.getByRole('button', { name: 'Create lease' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders without optional props', () => {
    const { container } = render(<PageHeader title="Dashboard" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });
});