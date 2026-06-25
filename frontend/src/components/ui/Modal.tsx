import { useEffect, useId, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { cn } from '../../lib/utils';

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  onClose: () => void;
};

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  className,
  onClose,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4 py-8 sm:items-center">
      <button
        type="button"
        aria-label="Fermer la fenetre"
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative z-10 w-full text-center flex flex-col items-center justify-center max-w-lg border-[3px] border-on-surface bg-surface p-6 neo-shadow',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-headline-md font-black text-[28px] leading-[32px] text-on-surface">
              {title}
            </h2>

            {description ? (
              <p id={descriptionId} className="mt-2 font-body-md text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </div>

          {/* <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 border-[3px] border-on-surface bg-surface"
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icon name="close" />
          </Button> */}
        </div>

        {children ? <div className="mb-6">{children}</div> : null}

        {footer ? <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div> : null}
      </div>
    </div>
  );
}