import { PropsWithChildren, useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onCancel: () => void;
};

export const Dialog = ({
  open,
  children,
  onCancel,
}: PropsWithChildren<Props>) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      style={{ position: 'relative' }}
      onCancel={() => onCancel()}
      onClick={(event) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const clickInside = event.clientX > rect.left
            && event.clientX < rect.right
            && event.clientY > rect.top
            && event.clientY < rect.bottom;

          if (!clickInside) {
            onCancel();
          }
        }
      }}
    >
      {children}
    </dialog>
  );
};