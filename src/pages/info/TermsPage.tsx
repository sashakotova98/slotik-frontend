import { Link } from "react-router-dom";
import Header from "../../components/Header";


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

export default function TermsPage() {

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
    <div className="min-h-screen bg-bg text-black">
      <Header />
      <main className="px-3 pb-8 pt-5 sm:px-6 sm:py-8">
        <article aria-labelledby="terms-title" className="mx-auto max-w-2xl rounded-2xl bg-white px-5 py-5 shadow-lg sm:rounded-3xl sm:p-8">
          <h1 id="terms-title" className="text-xl font-bold leading-tight sm:text-3xl">
            Умови користування та обробка персональних даних
          </h1>
          <p className="mt-4 text-[11px] text-neutral-400 sm:text-sm">
            Останнє оновлення: <time dateTime={dateTime}>{formattedDate}</time>
          </p>
          <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">
            {sections.map(({ title, text }) => (
              <section key={title}>
                <h2 className="text-sm font-bold sm:text-lg">{title}</h2>
                <p className="mt-1 text-xs leading-snug text-neutral-600 sm:text-base sm:leading-relaxed">{text}</p>
              </section>
            ))}
          </div>
          <Link to="/login?tab=register" className="mt-4 flex min-h-11 items-center justify-center rounded-lg bg-neutral-200 px-3 py-3 text-center text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:mt-6 sm:text-sm">
            Повернутися до реєстрації
          </Link>
        </article>
      </main>
    </div>
  );
}
