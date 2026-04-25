import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BookCover from '../../../src/lib/components/BookCover.svelte';

describe('<BookCover>', () => {
  it('renders an <img> with the first source', () => {
    const { container } = render(BookCover, {
      sources: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      title: 'Test',
      author: 'Test Author',
    });
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/a.jpg');
  });

  it('falls through to generated cover when given empty sources', () => {
    const { container } = render(BookCover, {
      sources: [],
      title: 'Sjálfstætt fólk',
      author: 'Halldór Laxness',
    });
    expect(container.querySelector('.cover-art')).toBeTruthy();
    expect(container.querySelector('img')).toBeFalsy();
  });
});
