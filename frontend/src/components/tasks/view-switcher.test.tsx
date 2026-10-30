import { render, screen } from '@testing-library/react';
import { ViewSwitcher } from './view-switcher';

describe('ViewSwitcher', () => {
  it('links to each view through the URL', () => {
    render(<ViewSwitcher active="list" />);

    expect(screen.getByRole('link', { name: 'List' })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: 'Board' })).toHaveAttribute(
      'href',
      '/tasks?view=board',
    );
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
      'href',
      '/tasks?view=calendar',
    );
  });

  it('marks only the active view as the current page', () => {
    render(<ViewSwitcher active="board" />);

    expect(screen.getByRole('link', { name: 'Board' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'List' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Calendar' })).not.toHaveAttribute('aria-current');
  });
});
