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

  it('advances to next source on error and falls through when exhausted', async () => {
    const { tick } = await import('svelte');
    const { container } = render(BookCover, {
      sources: ['bad1', 'bad2'],
      title: 'X',
      author: 'Y',
    });
    const img = container.querySelector('img')!;
    img.dispatchEvent(new Event('error'));
    await tick();
    expect(container.querySelector('img')?.getAttribute('src')).toBe('bad2');
    container.querySelector('img')!.dispatchEvent(new Event('error'));
    await tick();
    expect(container.querySelector('.cover-art')).toBeTruthy();
  });
});
