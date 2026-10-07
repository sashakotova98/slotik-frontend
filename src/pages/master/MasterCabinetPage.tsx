import { Link } from "react-router-dom";

export default function MasterCabinetPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Кабінет майстра</h1>
      {/* Значення з’являться після підключення API. */}
      <section aria-label="Статистика" className="grid grid-cols-2 gap-5 border-y border-neutral-200 py-5">
        {["Перегляди сторінки", "Записів", "Дохід за місяць", "Неявки"].map((label) => (
          <div key={label}><p className="text-3xl font-semibold" aria-label="Дані ще не завантажено">—</p><p className="text-sm">{label}</p></div>
        ))}
      </section>
      <p className="text-sm text-neutral-500">Статистику ще не підключено.</p>
      <section className="rounded-2xl border border-neutral-200 p-4">
        <h2 className="font-semibold">Найближчий запис</h2>
        <p className="my-3 text-sm text-neutral-500">Дані записів ще не підключено.</p>
        <Link to="/cabinet/calendar" className="underline">Відкрити календар</Link>
      </section>
      <section><h2 className="text-xl font-semibold">Відгуки</h2><p className="mt-2 text-sm text-neutral-500">Відгуки та рейтинг ще не підключено.</p></section>
    </div>
  );
}
