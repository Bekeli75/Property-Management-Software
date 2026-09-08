import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '@/components/ui/EmptyState';

const Icon = (props) => <svg data-testid="empty-icon" {...props} />;

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No units yet" description="Add your first unit." />);
    expect(screen.getByText('No units yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first unit.')).toBeInTheDocument();
  });

  it('renders the icon when provided', () => {
    render(<EmptyState icon={Icon} title="Nothing here" />);
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('triggers the action when the button is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<EmptyState title="Empty" actionLabel="Create one" onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Create one' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('uses sensible defaults without a title', () => {
    const { container } = render(<EmptyState />);
    expect(container.querySelector('h3')).toHaveTextContent('Nothing here yet');
  });
});