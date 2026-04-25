import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { libraryScope } from '../../../src/lib/stores.js';
import LibraryScopePicker from '../../../src/lib/components/LibraryScopePicker.svelte';

describe('<LibraryScopePicker>', () => {
  it('opens a sheet listing scopes when the trigger is clicked', async () => {
    const { container, getByText } = render(LibraryScopePicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(trigger);
    expect(getByText('Borgarbókasafn Reykjavíkur')).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('shows placeholder text when no scope selected', () => {
    const { container } = render(LibraryScopePicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    expect(trigger.textContent).toContain('Veldu safn');
  });

  it('closes sheet when backdrop is clicked', async () => {
    const { container, queryByText } = render(LibraryScopePicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    await fireEvent.click(trigger);
    expect(queryByText('Borgarbókasafn Reykjavíkur')).toBeTruthy();

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    // Click on the dialog backdrop itself (the semi-transparent area), not the inner content
    await fireEvent.click(dialog as HTMLElement, { bubbles: true });

    expect(container.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('closes sheet when Escape key is pressed', async () => {
    const { container } = render(LibraryScopePicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    await fireEvent.click(trigger);

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    await fireEvent.keyDown(dialog as HTMLElement, { key: 'Escape' });

    expect(container.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('selects a scope and updates store', async () => {
    const { container, getByText } = render(LibraryScopePicker);
    const trigger = container.querySelector('.scope') as HTMLElement;

    await fireEvent.click(trigger);
    const kópavogButton = getByText('Bókasafn Kópavogs') as HTMLElement;
    expect(kópavogButton.getAttribute('aria-current')).toBeNull();

    await fireEvent.click(kópavogButton);

    expect(get(libraryScope)).toEqual({ code: '10000_KOP', label: 'Bókasafn Kópavogs' });
    expect(container.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('has proper accessibility attributes', async () => {
    const { container } = render(LibraryScopePicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');

    await fireEvent.click(trigger);

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
  });
});
