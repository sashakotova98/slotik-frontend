// тут 

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Master } from "../../api/masters";

type Props = {
  master: Master;
  onClose: () => void;
};

const tariffLabels: Record<"free" | "basic" | "pro", string> = {
  free: "Безкоштовний",
  basic: "Базовий",
  pro: "Професійний",
};

export function MasterDetailsModal({ master, onClose }: Props) {

  // const [saving, setSaving] = useState(false);// запрос выполняется, кнопку временно отключаем.


  // состояния и useEffect setSaving(true); Перед запросом

  // function handleChangeTariff() {
  //   // открыть выбор тарифа
  // }

  // function handleOpenProfile() {
  //   // перейти в профиль мастера
  // }

  // function handleBlockMaster() { }

  // function handleExtendSubscription() {
  //   // Здесь откроем окно выбора срока продления.
  // }



  const dialogRef = useRef<HTMLDialogElement>(null);

  const initials =
    `${master.firstName.charAt(0)}${master.lastName.charAt(0)}`.toUpperCase();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  function handleClose() {
    dialogRef.current?.close();
    onClose();
  }

  const isActive = master.status === "active";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="master-details-title"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-105 overflow-y-auto rounded-[40px] border-0 bg-surface p-5 text-text shadow-xl backdrop:bg-black/40 sm:p-6"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Закрити подробиці майстра"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-selected"
        >
          <X size={28} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-1 flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-selected text-2xl text-muted"
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h2
            id="master-details-title"
            className="wrap-break-word text-base font-medium"
          >
            {master.firstName} {master.lastName}
          </h2>
          <div className="mt-1 flex w-full items-center justify-between gap-2">
            <p className="min-w-0 rounded-full bg-selected px-2 py-0.5 text-xs">
              {master.category}
            </p>

            <span
              className={`inline-block rounded-full px-3 py-0.5 text-xs ${isActive
                ? "bg-[#d5edce] text-[#47783b]"
                : "bg-[#ffd5dd] text-[#a71930]"
                }`}
            >
              {isActive ? "Активна" : "Прострочено"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            На платформі з —
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-2xl border border-border p-4 text-sm">
        <dt className="text-muted">Email</dt>
        <dd className="wrap-break-word text-right">
          {/* {master.email} */}
        </dd>

        <dt className="text-muted">Телефон</dt>
        <dd className="wrap-break-word text-right">
          {/* {master.phone ? `+${master.phone}` : "Не вказано"} */}
        </dd>

        <dt className="text-muted">Тариф</dt>
        <dd className="wrap-break-word text-right">
          {tariffLabels[master.tariff]}
          {master.tariff !== "free" && (
            <span> • — ₴/міс</span>
          )}
        </dd>

        <dt className="text-muted">Наступна оплата</dt>
        <dd className="text-right">—</dd>

        <dt className="text-muted">Записів за весь час</dt>
        <dd className="text-right">—</dd>
      </dl>

      {/* <section className="mt-4" aria-label="Історія оплат">
        <h3 className="text-sm text-muted">
          Історія оплат
        </h3>
  // тут просто master 
        {masterDetails && (
          masterDetails.payments.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-border px-3 py-1">
              {masterDetails.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 border-b border-border px-2 py-2 text-sm last:border-b-0"
                >
                  <span>
                    {new Date(payment.paidAt).toLocaleDateString("uk-UA")}
                  </span>

                  <span className="shrink-0">
                    {payment.amount} ₴
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Оплат ще немає.
            </p>
          )
        )}
      </section> */}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled

          className="min-h-14 rounded-2xl border border-border px-3 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          Продовжити підписку
        </button>

        <button
          type="button"
          // onClick={handleExtendSubscription}
          // disabled={saving}
          className="min-h-14 rounded-2xl border border-border px-3 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          Змінити тариф
        </button>

        <button
          type="button"
          disabled
          // onClick={handleOpenProfile}
          className="min-h-12 rounded-2xl border border-border px-3 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          Відкрити профіль
        </button>

        <button
          type="button"
          disabled
          // onClick={handleBlockMaster}
          className="min-h-12 rounded-2xl border border-danger px-3 py-2 text-sm text-danger disabled:cursor-not-allowed disabled:opacity-50"
        >
          Заблокувати
        </button>
      </div>
    </dialog>
  );
}