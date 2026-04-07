import { useEffect, useRef, type PropsWithChildren } from "react";
import { X } from "lucide-react";

type Props = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
}>;

export default function FormModal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog ref={ref} className="admin-modal" onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="admin-modal-inner">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">{title}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </dialog>
  );
}
