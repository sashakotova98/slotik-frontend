import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminNav from "./AdminNav";

type Props = {
  title: string;
  back?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function AdminLayout({ title, back, action, children }: Props) {
  return (
    <div className="min-h-screen bg-bg pb-20">
      <header className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border">
        {back && <Link to={back} className="text-muted"><ArrowLeft size={20} /></Link>}
        <div className="flex flex-1 min-w-0 items-center gap-1">
          <img
            src="/icons/admin-badge.svg"
            alt=""
            className="h-5.25 w-5.25 shrink-0"
          />

          <h1 className="text-sm sm:text-lg font-medium text-text uppercase">
            Суперадмін • {title}
          </h1>
        </div>
        {action}
      </header>
      <main className="mx-auto w-full max-w-5xl p-4">
        {children}
      </main>
      <AdminNav />
    </div>
  );
}