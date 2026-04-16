import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import PublicEnquiryForm from "../BookNow/PublicEnquiryForm";
import contactStyles from "../BookNow/BookNowContact.module.css";
import styles from "./PackageEnquiryModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  packageId: string;
  packageTitle: string;
};

export default function PackageEnquiryModal({
  open,
  onClose,
  packageId,
  packageTitle,
}: Props) {
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
    <dialog
      ref={ref}
      className={styles.dialog}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className={styles.title} id="package-enquiry-title">
            Enquire about {packageTitle}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className={styles.body}>
          <div className={contactStyles.formCard}>
            <PublicEnquiryForm
              idPrefix="pkg-modal"
              source="package"
              packageId={packageId}
              packageTitle={packageTitle}
              onSuccess={onClose}
            />
          </div>
        </div>
      </div>
    </dialog>
  );
}
