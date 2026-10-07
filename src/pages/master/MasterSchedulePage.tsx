export default function MasterSchedulePage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Робочий графік</h1>
      {/* Тут підключимо збережений графік майстра. */}
      {["Робочі дні та години", "Перерви", "Крок запису", "Відпустка"].map((title) => (
        <section key={title} className="rounded-2xl border border-neutral-200 p-4">
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-neutral-500">Перегляд і редагування ще не підключено.</p>
        </section>
      ))}
    </div>
  );
}
