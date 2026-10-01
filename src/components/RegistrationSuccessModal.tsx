import { useEffect, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";

type Props = {
  onClose: () => void;
  onGoToLogin: () => void;
};

export default function RegistrationSuccessModal({
  onClose,
  onGoToLogin,
}: Props) {
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
      aria-labelledby="registration-success-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="
        fixed inset-0 m-auto
        w-[calc(100%-24px)] max-w-sm
        rounded-2xl border-0 bg-white
        p-5 text-black shadow-xl
        backdrop:bg-black/40
        sm:rounded-3xl sm:p-8
      "
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити"
          className="
            flex size-10 items-center justify-center
            rounded-lg text-neutral-500
            hover:bg-neutral-100
          "
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center px-2 pb-2">
        <div className="
          mb-4 flex size-14 items-center justify-center
          rounded-full bg-green-100
        ">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>

        <h2
          id="registration-success-title"
          className="text-xl font-semibold"
        >
          Готово!
        </h2>

        <p className="mt-3 text-sm text-neutral-600">
          Реєстрацію розпочато.
          Ми надіслали лист на вашу електронну пошту.
        </p>

        <p className="mt-2 text-sm text-neutral-600">
          Перейдіть за посиланням у листі, щоб підтвердити Email.
        </p>

        <button
          type="button"
          onClick={onGoToLogin}
          className="
            mt-6 w-full rounded-lg
            bg-black px-4 py-3
            text-sm font-medium text-white
            hover:bg-neutral-800
          "
        >
          Перейти до входу
        </button>
      </div>
    </dialog>
  );
}