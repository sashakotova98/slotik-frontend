import { useRef, useState, type FormEvent } from "react";
import { saveReviewReply, type MasterReview } from "../../api/reviews";
import ReviewPhotos from "../rewiews/ReviewPhotos";

type Props = {
  review: MasterReview;
  onReplySaved: (id: number, reply: string) => void
};

function time(value: string) {
  return new Date(value).toLocaleTimeString("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit" });
}

export default function MasterReviewCard({ review, onReplySaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false); // Використовується для запобігання повторного збереження одночасно.
  const name = review.clientFirstName || "Клієнт";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) {
      return;
    }
    if (!text.trim()) {
      setError("Напишіть відповідь на відгук.");
      return;
    }
    savingRef.current = true;
    setSaving(true); //блокуємо повторний виклик
    setError("");
    try {
      const result = await saveReviewReply(review.id, text.trim());
      onReplySaved(review.id, result.reply);
      setEditing(false);
    } catch {
      setError("Не вдалося зберегти відповідь. Спробуйте ще раз.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  return (
    <article className="space-y-3">
      <div className="space-y-3 rounded-2xl bg-surface p-4 shadow-[0_4px_18px_rgba(0,0,0,0.12)]">
        <div className="flex flex-wrap items-center gap-3">
          {review.clientAvatarUrl ? (
            <img src={review.clientAvatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#a38ba1] text-xl text-white"
            >
              {name.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{name}</p>
            <p className="mt-1 inline-block rounded-lg bg-panel-100 px-2 py-1 text-xs text-copy-600">
              {review.serviceName || "Послуга"}
              {review.durationMin != null && <> • {review.durationMin} хв</>}
              {review.price != null && <> • {review.price.toLocaleString("uk-UA")} ₴</>}
            </p>
          </div>
          <div aria-label={`Оцінка: ${review.rating} з 5`} className="flex gap-1 text-lg">
            {[1, 2, 3, 4, 5].map((star) => {
              return (
                <span key={star} aria-hidden="true" className={star <= review.rating ? "text-amber-400" : "text-neutral-200"}>
                  ★
                </span>
              );
            })}
          </div>
        </div>
        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">{review.text}</p>
        <ReviewPhotos photos={review.photos ?? []} />
        <div className="flex flex-wrap justify-between gap-2 text-xs text-copy-500">
          <span>{review.createdAt ? new Date(review.createdAt).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" }) : ""}</span>
          {review.startsAt && review.endsAt && (
            <span>
              {time(review.startsAt)}–{time(review.endsAt)}
            </span>
          )}
        </div>
        {review.reply && (
          <div className="rounded-xl bg-panel-50 p-3">
            <p className="mb-1 text-xs font-medium text-copy-500">Відповідь майстра</p>
            <p className="whitespace-pre-wrap wrap-break-word text-sm">{review.reply}</p>
          </div>
        )}
      </div>
      {editing ? (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border p-4">
          <label htmlFor={`reply-${review.id}`} className="block text-sm font-medium">
            Ваша відповідь
          </label>
          <textarea
            id={`reply-${review.id}`}
            autoFocus
            value={text}
            onChange={(event) => {
              setText(event.target.value);
            }}
            disabled={saving}
            rows={3}
            className="w-full resize-y rounded-xl border border-border p-3 text-sm focus:outline-2 focus:outline-text"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditing(false);
              }}
              className="min-h-11 rounded-xl border border-border px-4 text-sm disabled:opacity-50"
            >
              Скасувати
            </button>
            <button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-black px-4 text-sm text-white disabled:opacity-50">
              {saving ? "Збереження…" : "Зберегти відповідь"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setText(review.reply ?? "");
              setError("");
              setEditing(true);
            }}
            className="min-h-11 rounded-xl border border-border px-5 text-sm text-copy-700 transition hover:bg-panel-100 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {review.reply ? "Редагувати відповідь" : "Відповісти"}
          </button>
        </div>
      )}
    </article>
  );
}

