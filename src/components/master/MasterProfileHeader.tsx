import { ChevronLeft, Share2 } from "lucide-react";

type Props = {
  onBack: () => void;
  onShare: () => void;
};

export default function MasterProfileHeader({ onBack, onShare }: Props) {
  return (
    <header className="bg-surface px-3 pt-3 text-text sm:px-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Повернутися назад"
          className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-panel-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          <ChevronLeft size={24} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onShare}
          aria-label="Поділитися профілем"
          className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-panel-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          <Share2 size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
