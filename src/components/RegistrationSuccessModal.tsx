import { useEffect, useRef } from "react";
import { Mail, X } from "lucide-react";

type Props = {
  email: string;
  onClose: () => void;
  onGoToLogin: () => void;
};

export default function RegistrationSuccessModal({ email, onClose, onGoToLogin }: Props) {
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
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="
        fixed inset-0 m-auto
        w-[calc(100%-32px)] max-w-90
        rounded-3xl border-0 bg-white
        px-7 py-6 text-black
        shadow-2xl
        backdrop:bg-black/35
      "
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити"
          className="
            flex size-9 items-center justify-center
            rounded-lg text-neutral-500
            transition hover:bg-neutral-100
          "
        >
          <X size={20} />
        </button>
      </div>

      <div className="text-center">
        {/* Logo */}
        <div className="mt-1">
          <div className="text-[18px] font-semibold tracking-[0.32em]">SLOTIK</div>

          <div className="mt-1 text-[7px] tracking-[0.24em] text-neutral-400">КРАСА МАЄ СВІЙ ЧАС</div>
        </div>

        {/* Icon */}
        <div className="mx-auto mt-8 flex size-18 items-center justify-center rounded-full bg-neutral-100">
          <Mail size={34} strokeWidth={1.6} />
        </div>

        <h2 className="mt-6 text-[22px] font-semibold">Перевірте пошту</h2>

        <p className="mt-3 text-[14px] leading-6 text-neutral-600">
          Ми надіслали лист із посиланням
          <br />
          для підтвердження email.
        </p>

        <p className="mt-3 break-all text-[13px] font-medium text-neutral-800">{email}</p>

        <p className="mt-4 text-[12px] text-neutral-400">Перевірте також папку «Спам».</p>

        <button
          type="button"
          onClick={onGoToLogin}
          className="
            mt-7 w-full rounded-xl
            border border-black
            bg-white px-4 py-3
            text-sm font-medium text-black
            transition hover:bg-neutral-50
          "
        >
          Повернутися до входу
        </button>

        <div className="mt-8 text-[7px] tracking-[0.24em] text-neutral-400">КРАСИВІ ЛЮДИ — БЛИЖЧЕ</div>
      </div>
    </dialog>
  );
}
