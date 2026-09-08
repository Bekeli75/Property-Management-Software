import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Modal open={false} title="Add unit">body</Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, description, and children when open', () => {
    render(
      <Modal open title="Add unit" description="Create a new unit.">
        <p>Body content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add unit')).toBeInTheDocument();
    expect(screen.getByText('Create a new unit.')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('closes via the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal open title="Add unit" onClose={onClose}>body</Modal>);
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal open title="Add unit" onClose={onClose}>body</Modal>);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<Modal open title="Add unit" onClose={onClose}>body</Modal>);
    await user.click(container.querySelector('[role="presentation"]'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the footer', () => {
    render(
      <Modal open title="Add unit" footer={<button type="button">Save</button>}>
        body
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});