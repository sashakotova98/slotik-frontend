import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import TermsContent from "./TermsContent";

type Props = { onClose: () => void };

export default function TermsModal({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="terms-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-24px)] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-white p-5 text-black shadow-xl backdrop:bg-black/40 sm:rounded-3xl sm:p-8"
    >
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Закрити умови користування"
          className="flex size-11 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <X aria-hidden="true" className="size-6" />
        </button>
      </div>
      <TermsContent titleId="terms-modal-title" />
      <button
        type="button"
        onClick={onClose}
        className="mt-6 flex min-h-11 w-full items-center justify-center rounded-lg bg-neutral-200 px-3 py-3 text-center text-sm font-medium text-neutral-800 hover:bg-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Повернутися до реєстрації
      </button>
    </dialog>
  );
}
