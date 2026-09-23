import Header from "../../components/Header";

const contacts = [
  { title: "Telegram", value: "@slotik_support" },
  { title: "Email", value: "support@slotik.ua" },
  { title: "Графік роботи", value: "Пн–Пт, 09:00–18:00" },
];

const topics = [
  { value: "booking", label: "Запис до майстра" },
  { value: "payment", label: "Оплата" },
  { value: "profile", label: "Обліковий запис і профіль" },
  { value: "technical", label: "Технічна проблема" },
  { value: "other", label: "Інше" },
];

const fieldClassName = "mt-2 min-h-12 w-full rounded-lg border border-neutral-400 bg-white px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-base";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-bg text-black">
      <Header />
      <main className="px-3 pb-8 pt-5 sm:px-6 sm:py-8">
        <section aria-labelledby="support-title" className="mx-auto max-w-2xl rounded-2xl bg-white p-5 shadow-lg sm:rounded-3xl sm:p-8">
          <h1 id="support-title" className="text-2xl font-bold sm:text-3xl">Підтримка</h1>
          <p className="mt-3 text-sm leading-snug text-neutral-500 sm:text-base">
            Оберіть зручний спосіб зв’язку або надішліть звернення
          </p>

          <section aria-labelledby="contact-title" className="mt-3 rounded-xl border border-neutral-400 p-4 sm:p-5">
            <h2 id="contact-title" className="text-xl font-bold sm:text-2xl">Зв’яжіться з нами</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
              Ми допоможемо із записом, оплатою або налаштуваннями профілю.
            </p>
            <dl className="mt-3 space-y-3">
              {contacts.map(({ title, value }) => (
                <div key={title} className="rounded-xl bg-neutral-100 px-4 py-3">
                  <dt className="text-base font-semibold sm:text-lg">{title}</dt>
                  <dd className="mt-0.5 wrap-break-word text-sm text-neutral-600 sm:text-base">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="message-title" className="mt-3 rounded-xl border border-neutral-400 p-4 sm:p-5">
            <h2 id="message-title" className="text-xl font-bold sm:text-2xl">Надіслати звернення</h2>
            <form aria-labelledby="message-title" aria-describedby="support-form-notice" onSubmit={(event) => event.preventDefault()} className="mt-3 space-y-3">
              <div>
                <label htmlFor="support-topic" className="text-sm text-neutral-600">Тема звернення</label>
                <select id="support-topic" name="topic" defaultValue="" required className={`${fieldClassName} invalid:text-neutral-400`}>
                  <option value="" disabled>Оберіть тему</option>
                  {topics.map(({ value, label }) => (
                    <option key={value} value={value} className="text-black">{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="support-email" className="text-sm text-neutral-600">Email для відповіді</label>
                <input id="support-email" name="email" type="email" autoComplete="email" placeholder="name@example.com" required className={fieldClassName} />
              </div>
              <div>
                <label htmlFor="support-message" className="text-sm text-neutral-600">Повідомлення</label>
                <textarea id="support-message" name="message" rows={4} placeholder="Опишіть питання або проблему" required className={`${fieldClassName} min-h-32 resize-y`} />
              </div>
              <button type="submit" disabled aria-describedby="support-form-notice" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-neutral-300 px-4 py-3 text-center text-sm font-medium text-neutral-700 disabled:cursor-not-allowed sm:text-base">
                Надіслати
              </button>
              <p id="support-form-notice" className="text-xs leading-relaxed text-neutral-500">
                Надсилання звернень поки недоступне. Незабаром тут можна буде написати підтримці.
              </p>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
}
