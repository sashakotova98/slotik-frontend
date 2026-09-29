import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  profileUrl: string;
};

export default function ProfileShareCard({ profileUrl }: Props) {
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);

  async function handleCopy() {
    setMessage("");

    try {
      await navigator.clipboard.writeText(profileUrl);
      setMessage("Посилання скопійовано");
    } catch {
      setMessage("Не вдалося скопіювати. Виділіть посилання та скопіюйте вручну.");
    }
  }

  async function handleShare() {
    if (sharing) return;

    setMessage("");

    if (!navigator.share) {
      await handleCopy();
      return;
    }

    setSharing(true);

    try {
      await navigator.share({
        title: "Профіль майстра",
        url: profileUrl,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      setMessage("Не вдалося поділитися посиланням.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">
        Надішліть посилання на профіль майстра
      </p>

      <div className="flex overflow-hidden rounded-xl border border-neutral-300">
        <input
          type="text"
          aria-label="Посилання на профіль майстра"
          readOnly
          value={profileUrl}
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 bg-white px-3 py-3 text-sm"
        />

        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 px-3 py-3 text-sm text-blue-600 hover:bg-neutral-100"
        >
          Копіювати
        </button>
      </div>

      <div className="flex justify-center rounded-xl bg-white p-4">
        <QRCodeSVG
          value={profileUrl}
          size={200}
          level="M"
          marginSize={4}
          title="QR-код профілю майстра"
        />
      </div>

      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="min-h-11 w-full rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {sharing ? "Зачекайте…" : "Поділитися"}
      </button>

      <p role="status" className="text-sm text-neutral-600">
        {message}
      </p>
    </div>
  );
}