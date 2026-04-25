import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import LibraryScopePicker from '../../../src/lib/components/LibraryScopePicker.svelte';

describe('<LibraryScopePicker>', () => {
  it('opens a sheet listing scopes when the trigger is clicked', async () => {
    const { container, getByText } = render(LibraryScopePicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    await fireEvent.click(trigger);
    expect(getByText('Borgarbókasafn Reykjavíkur')).toBeTruthy();
  });
});
