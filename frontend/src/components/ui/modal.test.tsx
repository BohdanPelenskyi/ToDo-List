import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './modal';

describe('Modal', () => {
  it('is exposed as a dialog named by its title when open', () => {
    render(
      <Modal open title="Edit task" onClose={vi.fn()}>
        <button>Inside</button>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Edit task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inside' })).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(
      <Modal open={false} title="Edit task" onClose={vi.fn()}>
        <button>Inside</button>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inside' })).not.toBeInTheDocument();
  });

  it('asks the parent to close on Esc instead of closing itself', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Edit task" onClose={onClose}>
        <button>Inside</button>
      </Modal>,
    );

    // The browser fires "cancel" on the dialog when Esc is pressed.
    const notPrevented = fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(notPrevented).toBe(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('focuses the element marked data-autofocus when it opens', () => {
    render(
      <Modal open title="Edit task" onClose={vi.fn()}>
        <input aria-label="Title" data-autofocus />
        <button>Other</button>
      </Modal>,
    );

    expect(screen.getByLabelText('Title')).toHaveFocus();
  });

  it('has a close button that asks the parent to close', async () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Edit task" onClose={onClose}>
        <button>Inside</button>
      </Modal>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked but not when the content is', async () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Edit task" onClose={onClose}>
        <button>Inside</button>
      </Modal>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Inside' }));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.setup().click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes the native dialog when open becomes false', () => {
    const { rerender } = render(
      <Modal open title="Edit task" onClose={vi.fn()}>
        content
      </Modal>,
    );

    rerender(
      <Modal open={false} title="Edit task" onClose={vi.fn()}>
        content
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
