import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil } from 'lucide-react';
import { IconButton } from './icon-button';

describe('IconButton', () => {
  it('is named by its label and shows it as a tooltip', () => {
    render(
      <IconButton label="Edit Write tests">
        <Pencil />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Edit Write tests' });
    expect(button).toHaveAttribute('title', 'Edit Write tests');
  });

  it('hides the icon from assistive technology', () => {
    render(
      <IconButton label="Delete">
        <Pencil data-testid="icon" />
      </IconButton>,
    );

    expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('does not submit a surrounding form unless asked to', () => {
    render(
      <IconButton label="Close">
        <Pencil />
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('type', 'button');
  });

  it('calls onClick and respects disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <IconButton label="Log out" onClick={onClick}>
        <Pencil />
      </IconButton>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Log out' }));
    rerender(
      <IconButton label="Log out" onClick={onClick} disabled>
        <Pencil />
      </IconButton>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Log out' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
