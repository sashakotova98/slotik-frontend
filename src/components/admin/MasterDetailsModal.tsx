import { useEffect, useRef, useState } from "react";
import { X, FileText } from "lucide-react";
import { type Master, type MasterDetails, getMasterDetails, toggleMasterBlock, } from "../../api/masters";


type Props = {
  master: Master;
  onClose: () => void;
  onBlockChange: (id: number, isBlocked: boolean) => void;
};

const tariffLabels: Record<"free" | "basic" | "pro", string> = {
  free: "Безкоштовний",
  basic: "Базовий",
  pro: "Професійний",
};

export function MasterDetailsModal({ master, onClose, onBlockChange }: Props) {

  const [masterDetails, setMasterDetails] = useState<MasterDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState("");

  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [blockError, setBlockError] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      setDetailsLoading(true);
      setDetailsError("");
      setMasterDetails(null);

      try {
        const data = await getMasterDetails(master.id);
        setMasterDetails(data);
      } catch (err) {
        console.error(err);
        setDetailsError("Не вдалося завантажити подробиці майстра.");
      } finally {
        setDetailsLoading(false);
      }
    }

    void fetchDetails();
  }, [master.id]);


  // function handleChangeTariff() {
  //   // открыть выбор тарифа
  // }

  // function handleOpenProfile() {
  //   // перейти в профиль мастера
  // }

  function handleBlockMaster() {
    setBlockError("");
    setShowBlockConfirm(true);
  }

  async function handleConfirmBlock() {
    if (savingBlock || detailsLoading) return;

    setSavingBlock(true);
    setBlockError("");

    try {
      const result = await toggleMasterBlock(master.id);

      setMasterDetails((previous) =>
        previous
          ? { ...previous, isBlocked: result.isBlocked }
          : previous
      );

      onBlockChange(master.id, result.isBlocked);
      setShowBlockConfirm(false);
    } catch (error) {
      console.error(error);
      setBlockError("Не вдалося змінити блокування майстра.");
    } finally {
      setSavingBlock(false);
    }
  }

  // function handleExtendSubscription() {
  //
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
  const currentMaster = masterDetails ?? master;

  const isFree = currentMaster.tariff === "free";
  const isActive = currentMaster.status === "active";
  const isExpired = currentMaster.status === "expired";
  const isBlocked = currentMaster.isBlocked;

  function formatDate(value: string | null | undefined): string {
    if (!value) return "Не вказано";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Не вказано";
    }

    return date.toLocaleDateString("uk-UA");
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={showBlockConfirm ? "block-confirm-title" : "master-details-title"}
      onCancel={(event) => {
        event.preventDefault();
        if (savingBlock) return;
        if (showBlockConfirm) {
          setShowBlockConfirm(false);
        } else {
          handleClose();
        }
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-105 overflow-y-auto rounded-[40px] border-0 bg-surface p-5 text-text shadow-xl backdrop:bg-black/40 sm:p-6"
    >
      {showBlockConfirm ? (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowBlockConfirm(false)}
              disabled={savingBlock}
              aria-label="Скасувати"
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-selected disabled:opacity-50"
            >
              <X size={28} aria-hidden="true" />
            </button>
          </div>

          <h2 id="block-confirm-title" className="text-lg font-medium">
            {isBlocked
              ? "Ви точно хочете розблокувати майстра?"
              : "Ви точно хочете заблокувати майстра?"}
          </h2>

          {blockError && (
            <p className="mt-3 text-sm text-danger" role="alert">
              {blockError}
            </p>
          )}

          <button
            type="button"
            onClick={handleConfirmBlock}
            disabled={savingBlock}
            className="mt-5 min-h-12 w-full rounded-2xl border border-border bg-selected px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingBlock
              ? "Збереження…"
              : isBlocked
                ? "Так, розблокувати"
                : "Так, заблокувати"}
          </button>
        </>
      ) : (
        <>
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
                {currentMaster.firstName} {currentMaster.lastName}
              </h2>
              <div className="mt-1 flex w-full items-center justify-between gap-2">
                <p className="min-w-0 rounded-full bg-selected px-2 py-0.5 text-xs">
                  {currentMaster.category}
                </p>

                <span
                  className={`inline-block shrink-0 rounded-full px-3 py-0.5 text-xs ${isBlocked
                    ? "bg-[#e8e8e8] text-[#666666]"
                    : isActive
                      ? "bg-[#d5edce] text-[#47783b]"
                      : "bg-[#ffd5dd] text-[#a71930]"
                    }`}
                >
                  {isBlocked
                    ? "Заблокований"
                    : isActive
                      ? "Активна"
                      : "Прострочено"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                На платформі з {formatDate(currentMaster.createdAt)}
              </p>
            </div>
          </div>

          {detailsLoading && (
            <p className="mt-4 text-sm text-muted" role="status">
              Завантаження подробиць…
            </p>
          )}

          {detailsError && (
            <p className="mt-4 text-sm text-danger" role="alert">
              {detailsError}
            </p>
          )}

          {masterDetails && (
            <dl className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-2xl border border-border p-4 text-sm">
              <dt className="text-muted">Email</dt>
              <dd className="wrap-break-word text-right">
                {masterDetails.email || "Не вказано"}
              </dd>

              <dt className="text-muted">Телефон</dt>
              <dd className="wrap-break-word text-right">
                {masterDetails.phone || "Не вказано"}
              </dd>
              <dt className="text-muted">Тариф</dt>
              <dd className="wrap-break-word text-right">
                {tariffLabels[masterDetails.tariff]}

                {!isFree && masterDetails.tariffPrice != null && (
                  <span>
                    {" "}• {masterDetails.tariffPrice} ₴
                    {masterDetails.billingPeriod === "month" ? "/міс" : ""}
                  </span>
                )}
              </dd>

              <dt className="text-muted">
                {isFree ? "Термін" : isExpired ? "Закінчилась" : "Діє до"}
              </dt>

              <dd className="text-right">
                {isFree
                  ? "Безстроково"
                  : formatDate(currentMaster.subscriptionUntil)}
              </dd>

              <dt className="text-muted">Записів за весь час</dt>
              <dd className="text-right">
                {masterDetails.bookingsCount ?? "Не вказано"}
              </dd>
            </dl>
          )}


          <section className="mt-4" aria-label="Історія оплат">
            <h3 className="text-sm text-muted">
              Історія оплат
            </h3>

            {
              detailsLoading ? (
                <p className="mt-3 text-sm text-muted" role="status">
                  Завантаження історії…
                </p>
              ) : !masterDetails || masterDetails.payments === null ? (
                <p className="mt-3 text-sm text-muted">
                  Історія оплат поки недоступна.
                </p>
              ) : masterDetails.payments.length === 0 ? (
                <div className="mt-3 flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border p-4 text-muted">
                  <FileText size={24} strokeWidth={1.5} aria-hidden="true" />
                  <p className="text-sm">Оплат ще немає</p>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-border px-3 py-1">
                  {masterDetails.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-4 border-b border-border px-2 py-2 text-sm last:border-b-0"
                    >
                      <span>{formatDate(payment.paidAt)}</span>

                      <span className="shrink-0">
                        {payment.amount} ₴
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          </section>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {!isFree && (
              <button
                type="button"
                disabled
                className="min-h-14 rounded-2xl border border-border px-3 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExpired ? "Поновити підписку" : "Продовжити підписку"}
              </button>
            )}

            <button
              type="button"
              disabled
              className={`min-h-14 rounded-2xl border border-border px-3 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-50 ${isFree ? "col-span-2" : ""
                }`}
            >
              Змінити тариф
            </button>

            <button
              type="button"
              disabled
              className="min-h-12 rounded-2xl border border-border px-3 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              Відкрити профіль
            </button>

            <button
              type="button"
              onClick={handleBlockMaster}
              disabled={detailsLoading || savingBlock}
              className="min-h-12 rounded-2xl border border-danger px-3 py-2 text-sm text-danger disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBlocked ? "Розблокувати" : "Заблокувати"}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
