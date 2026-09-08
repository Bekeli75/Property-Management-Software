import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import Skeleton, { SkeletonCard, SkeletonStat, SkeletonTable } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('accepts an extra class name', () => {
    const { container } = render(<Skeleton className="w-1/2" />);
    expect(container.querySelector('.skeleton').className).toContain('w-1/2');
  });
});

describe('SkeletonCard', () => {
  it('renders several skeleton lines inside a card', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.card [aria-hidden="true"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(3);
  });
});

describe('SkeletonTable', () => {
  it('renders header and body rows', () => {
    const { container } = render(<SkeletonTable rows={3} cols={4} />);
    expect(container.querySelectorAll('.skeleton').length).toBe(16);
  });
});

describe('SkeletonStat', () => {
  it('renders a stat placeholder', () => {
    const { container } = render(<SkeletonStat />);
    expect(container.querySelector('.card [aria-hidden="true"]')).toBeInTheDocument();
  });
});