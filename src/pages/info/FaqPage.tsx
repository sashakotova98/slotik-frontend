import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import Header from "../../components/Header";


const questions = [
  {
    id: "booking",
    question: "Як записатися до майстра?",
    answer: "Оберіть послугу або майстра, дату й вільний час. Після підтвердження заявка з’явиться у розділі «Записи».",
  },
  {
    id: "cancel",
    question: "Як скасувати або перенести запис?",
    answer: "Відкрийте свій запис і перевірте доступні дії. Якщо скасування або перенесення недоступне, зверніться до майстра чи підтримки.",
  },
  {
    id: "confirmation",
    question: "Коли майстер підтвердить запис?",
    answer: "Час підтвердження залежить від майстра. Якщо потрібно уточнити статус запису, зверніться до майстра або підтримки.",
  },
  {
    id: "payment",
    question: "Як працює оплата?",
    answer: "Перед записом уточніть у майстра спосіб оплати та необхідність передоплати. Якщо виникли запитання щодо оплати, зверніться до підтримки.",
  },
  {
    id: "history",
    question: "Де знайти історію записів?",
    answer: "Увійдіть до свого акаунта та відкрийте розділ «Записи». Якщо не можете знайти потрібний запис, зверніться до підтримки.",
  },
];

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>("booking");
  const query = search.trim().toLocaleLowerCase("uk-UA");
  const filteredQuestions = questions.filter(({ question, answer }) =>
    `${question} ${answer}`.toLocaleLowerCase("uk-UA").includes(query),
  );

  return (
    <div className="min-h-screen bg-bg text-black">
      <Header />
      <main className="px-3 pb-8 pt-5 sm:px-6 sm:py-8">
        <section aria-labelledby="faq-title" className="mx-auto max-w-2xl rounded-2xl bg-white p-5 shadow-lg sm:rounded-3xl sm:p-8">
          <h1 id="faq-title" className="text-2xl font-bold sm:text-3xl">Часті запитання</h1>
          <p className="mt-3 text-sm leading-snug text-neutral-500 sm:text-base">
            Швидкі відповіді про записи, оплату та роботу сервісу
          </p>
          <label htmlFor="faq-search" className="sr-only">Пошук за запитаннями</label>
          <input
            id="faq-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук за запитаннями"
            className="mt-2 min-h-12 w-full rounded-lg border border-neutral-400 bg-white px-4 text-sm placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-base"
          />
          <div className="mt-3 space-y-3">
            {filteredQuestions.map(({ id, question, answer }) => {
              const isOpen = openId === id;
              return (
                <section key={id} className="overflow-hidden rounded-lg border border-neutral-400">
                  <h2>
                    <button
                      id={`faq-question-${id}`}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${id}`}
                      onClick={() => setOpenId(isOpen ? null : id)}
                      className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black sm:text-base ${isOpen ? "font-bold" : "font-normal"}`}
                    >
                      {question}
                      {isOpen ? <Minus aria-hidden="true" className="size-4 shrink-0" /> : <Plus aria-hidden="true" className="size-4 shrink-0" />}
                    </button>
                  </h2>
                  <div id={`faq-answer-${id}`} role="region" aria-labelledby={`faq-question-${id}`} hidden={!isOpen}>
                    <p className="px-4 pb-4 text-sm leading-relaxed text-neutral-600 sm:text-base">{answer}</p>
                  </div>
                </section>
              );
            })}
            {filteredQuestions.length === 0 && (
              <p role="status" className="py-4 text-sm text-neutral-600">
                За вашим запитом нічого не знайдено. Спробуйте інші слова або зверніться до підтримки.
              </p>
            )}
          </div>
          <section aria-labelledby="faq-support-title" className="mt-3 rounded-xl border border-neutral-400 p-4">
            <h2 id="faq-support-title" className="text-xl font-bold sm:text-2xl">Не знайшли відповідь?</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
              Напишіть нам — команда підтримки допоможе із записом, оплатою або роботою профілю.
            </p>
            <a href="mailto:support@slotik.ua" className="mt-2 inline-flex min-h-11 items-center break-all text-sm text-blue-600 hover:underline sm:text-base">support@slotik.ua</a>
            <Link to="/support" className="mt-1 flex min-h-12 items-center justify-center rounded-xl bg-neutral-200 px-4 py-3 text-center text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-base">
              Перейти до підтримки
            </Link>
            <p className="mt-3 text-xs text-neutral-500">Середній час відповіді — до 24 годин</p>
          </section>
        </section>
      </main>
    </div>
  );
}
