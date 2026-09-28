const sections = [
  {
    title: "1. Загальні положення",
    text: "Використовуючи SLOTIK, користувач підтверджує, що ознайомився з цими умовами та погоджується дотримуватися правил сервісу. Платформа допомагає клієнтам знаходити майстрів, обирати послуги та створювати записи.",
  },
  {
    title: "2. Обліковий запис",
    text: "Для роботи із сервісом користувач надає актуальні контактні дані та відповідає за безпеку свого облікового запису. Дані профілю можна змінити у налаштуваннях.",
  },
  {
    title: "3. Персональні дані",
    text: "SLOTIK обробляє ім’я, контактні дані, інформацію профілю, історію записів та технічні дані, необхідні для роботи сервісу. Дані не передаються третім особам без законної підстави.",
  },
  {
    title: "4. Зберігання та захист",
    text: "Інформація зберігається лише протягом строку, необхідного для надання послуг або виконання вимог законодавства. Для захисту даних застосовуються технічні та організаційні заходи безпеки.",
  },
  {
    title: "5. Права користувача",
    text: "Користувач може переглянути, виправити або видалити свої дані, а також відкликати згоду на їх обробку. Для цього потрібно звернутися до підтримки через відповідний розділ сервісу.",
  },
];

export default function TermsContent({ titleId }: { titleId: string }) {
  const today = new Date();

  const dateTime = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const formattedDate = today.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
          <h1 id={titleId} className="text-xl font-bold leading-tight sm:text-3xl">
            Умови користування та обробка персональних даних
          </h1>
          <p className="mt-4 text-[11px] text-neutral-400 sm:text-sm">
            Поточна дата: <time dateTime={dateTime}>{formattedDate}</time>
          </p>
          <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">
            {sections.map(({ title, text }) => (
              <section key={title}>
                <h2 className="text-sm font-bold sm:text-lg">{title}</h2>
                <p className="mt-1 text-xs leading-snug text-neutral-600 sm:text-base sm:leading-relaxed">{text}</p>
              </section>
            ))}
          </div>
    </>
  );
}
