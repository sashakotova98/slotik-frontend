import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import ProfileShareCard from "./ProfileShareCard";

type Props = {
  profileUrl: string;
  onClose: () => void;
};

export default function ProfileShareModal({ profileUrl, onClose }: Props) {
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
      aria-labelledby="profile-share-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border-0 bg-white p-5 text-black shadow-xl backdrop:bg-black/40"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="profile-share-title" className="text-xl font-semibold">
          Поділитися профілем
        </h2>

        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Закрити вікно"
          className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <X size={24} aria-hidden="true" />
        </button>
      </div>

      <ProfileShareCard profileUrl={profileUrl} />
    </dialog>
  );
}
