'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './icon-button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// A native <dialog> opened with showModal() provides the focus trap, Esc handling, inert
// background and focus restoration, so none of that is re-implemented here.
// On phones it becomes a bottom sheet; from the sm breakpoint it is a centred card.
export function Modal({ open, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // The browser would focus the first control, i.e. the close icon. React's autoFocus cannot help
      // because the content mounts while the dialog is still closed, so the target is marked instead.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Let the parent own the open state, so Esc and the backdrop go through onClose.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="animate-sheet-in m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain rounded-2xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 max-sm:mx-0 max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-t-3xl max-sm:rounded-b-none"
    >
      <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold tracking-tight text-balance">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose} className="-mt-1.5 -mr-2">
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="mt-4">{open && children}</div>
      </div>
    </dialog>
  );
}
