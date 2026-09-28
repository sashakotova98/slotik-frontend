import { Link } from "react-router-dom";
import Header from "../../components/Header";
import TermsContent from "../../components/TermsContent";


export default function TermsPage() {

  return (
    <div className="min-h-screen bg-bg text-black">
      <Header showBack backFallback="/login?tab=register" />
      <main className="px-3 pb-8 pt-5 sm:px-6 sm:py-8">
        <article aria-labelledby="terms-title" className="mx-auto max-w-2xl rounded-2xl bg-white px-5 py-5 shadow-lg sm:rounded-3xl sm:p-8">
          <TermsContent titleId="terms-title" />
          <Link to="/login?tab=register" className="mt-4 flex min-h-11 items-center justify-center rounded-lg bg-neutral-200 px-3 py-3 text-center text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:mt-6 sm:text-sm">
            Повернутися до реєстрації
          </Link>
        </article>
      </main>
    </div>
  );
}
