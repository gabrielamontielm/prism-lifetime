import { describe, it, expect } from 'vitest';

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

describe('formatDate utility', () => {
  it('formats yyyy-mm-dd correctly', () => {
    expect(formatDate('2024-05-12')).toContain('May 12, 2024');
  });

  it('handles empty string', () => {
    expect(formatDate('')).toBe('');
  });
});
