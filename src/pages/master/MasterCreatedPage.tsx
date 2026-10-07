import { useEffect, useState } from "react";
import PaymentSuccess from "../../components/master/PaymentSuccess";
import { getOwnProfile } from "../../api/users";
import { useAuth } from "../../hooks/useAuth";

export default function MasterCreatedPage() {
  const { token } = useAuth();
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    let active = true;

    getOwnProfile(token)
      .then((user) => {
        if (!active) return;

        const savedSlug = user.master?.slug;
        if (!savedSlug) {
          setError("Посилання на профіль не знайдено.");
          return;
        }

        setSlug(savedSlug);
      })
      .catch(() => {
        if (active) {
          setError("Не вдалося завантажити профіль.");
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-neutral-200 to-neutral-400 px-4 py-10">
      {error ? (
        <p role="alert">{error}</p>
      ) : slug ? (
        <PaymentSuccess slug={slug} />
      ) : (
        <p role="status">Завантаження…</p>
      )}
    </main>
  );
}