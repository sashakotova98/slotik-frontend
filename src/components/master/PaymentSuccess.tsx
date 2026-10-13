import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Eye } from "lucide-react";

type Props = {
  slug: string | null;
  title?: string;
};

export default function PaymentSuccess({ slug, title = "Сторінку створено!" }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  // Посилання на публічну сторінку майстра.
  const profilePath = slug
    ? `/m/${encodeURIComponent(slug)}`
    : "";

  const profileUrl = profilePath
    ? `${window.location.origin}${profilePath}`
    : "";

  const handleCopy = async () => {
    if (!profileUrl) return;

    setCopyError("");

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
    } catch {
      setCopyError("Не вдалося скопіювати. Виділіть посилання вручну.");
    }
  };

  return (
    <section className="w-full max-w-xl rounded-[48px] bg-neutral-100 px-6 py-10 text-center shadow-2xl sm:rounded-[64px] sm:px-10 sm:py-14">
      <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-[#c9eac3]">
        <Check
          size={52}
          strokeWidth={2.5}
          aria-hidden="true"
          className="text-[#507b40]"
        />
      </div>

      <h1 className="mt-7 text-2xl font-semibold">
        {title}
      </h1>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-400 px-3 py-2">
        <input
          readOnly
          aria-label="Посилання на сторінку майстра"
          value={profileUrl}
          placeholder="Посилання ще не завантажено"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-600 outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 sm:text-base"
        />

        <button
          type="button"
          onClick={handleCopy}
          disabled={!profileUrl}
          className="flex shrink-0 items-center gap-1.5 rounded text-sm text-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
        >
          <Copy size={19} aria-hidden="true" />
          {copied ? "Скопійовано" : "Копіювати"}
        </button>
      </div>

      {copyError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {copyError}
        </p>
      )}

      <Link
        to="/cabinet"
        className="mt-7 block rounded-2xl bg-black px-4 py-4 text-lg font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Перейти в кабінет
      </Link>

      {profilePath ? (
        <Link
          to={profilePath}
          state={{ returnTo: "/cabinet" }}
          className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-neutral-500 px-4 py-4 text-base font-medium text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Eye size={21} aria-hidden="true" className="shrink-0" />
          Подивитись на сторінку очима клієнта
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-300 px-4 py-4 text-base text-neutral-400"
        >
          <Eye size={21} aria-hidden="true" className="shrink-0" />
          Подивитись на сторінку очима клієнта
        </button>
      )}
    </section>
  );
}
