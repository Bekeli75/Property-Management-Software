import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormField from '@/components/ui/FormField';

describe('FormField', () => {
  it('renders a label linked to the control', () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" />
      </FormField>
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('marks required labels with an asterisk', () => {
    render(
      <FormField label="Name" required>
        <input />
      </FormField>
    );
    const label = screen.getByText('Name');
    expect(label).toHaveTextContent('*');
  });

  it('shows the hint text', () => {
    render(
      <FormField label="Password" hint="At least 8 characters">
        <input />
      </FormField>
    );
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('surfaces errors with an alert role', () => {
    render(
      <FormField label="Password" error="Too short">
        <input />
      </FormField>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
  });

  it('skips the label when omitted', () => {
    const { container } = render(
      <FormField>
        <input />
      </FormField>
    );
    expect(container.querySelector('label')).not.toBeInTheDocument();
  });
});