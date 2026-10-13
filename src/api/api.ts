// Адреса API задається під час збірки через змінну оточення.
const BASE_URL = import.meta.env.VITE_API_URL ?? "https://localhost:7041/api";

//мій клас для обробки помилок API
export class ApiError extends Error {
  readonly status: number; // HTTP status code 409 (e.g., 404, 500)
  readonly code?: string; //причина, наприклад, термін дії _booking_production
  readonly errors?: Record<string, string[]>; // список помилок по полях, якщо є
  readonly retryAfterSeconds?: number; // кількість секунд, після яких можна повторити запит

  constructor(
    message: string, // зрозуміле повідомлення для користувача
    status: number,
    details: {
      code?: string;
      errors?: Record<string, string[]>;
      retryAfterSeconds?: number;
    } = {},
  ) {
    super(message); // викликаємо конструктор базового класу Error з повідомленням
    this.name = "ApiError";
    this.status = status;
    this.code = details.code;
    this.errors = details.errors;
    this.retryAfterSeconds = details.retryAfterSeconds;
  }
}

// Коди звірені з відповідями бекенду. Невідомий код теж зберігаємо в ApiError.code.
const ERROR_MESSAGES: Record<string, string> = {
  pending_booking_expired: "Час очікування підтвердження минув. Цей запис уже не можна підтвердити.",
  invalid_status_transition: "Неможливо змінити статус запису таким чином. Оновіть список записів.",
  pending_booking_limit: "Досягнуто ліміту записів, що очікують підтвердження.",
  active_bookings_conflict: "Зміна конфліктує з майбутніми активними записами. Спочатку вирішіть конфлікт із цими записами.",
  active_bookings_exist: "На вибрані дати є активні записи. Спочатку скасуйте їх або виберіть інші дати відсутності.",
  days_off_overlap: "Цей період перетинається з уже збереженим періодом відсутності.",
  service_changed: "Дані послуги змінилися. Оновіть сторінку та виберіть послугу повторно.",
  booking_changed_retry: "Запис змінився. Оновіть список і повторіть дію.",
  terminal_booking_immutable: "Завершений або скасований запис уже не можна змінити.",
  booking_cannot_be_cancelled: "Цей запис уже не можна скасувати.",
  booking_not_found: "Запис не знайдено. Оновіть список записів.",
  slot_already_booked: "Цей час уже зайнято. Виберіть інший час.",
  slot_unavailable: "Цей час недоступний для запису. Виберіть інший час.",
  booking_outside_horizon: "Дата запису поза дозволеним періодом. Виберіть іншу майбутню дату.",
  invalid_booking_time: "Перевірте час початку та завершення запису.",
  invalid_service_duration: "Тривалість запису не відповідає тривалості послуги або задана некоректно.",
  invalid_slot_step: "Некоректний крок запису або вибраний час не відповідає кроку запису.",
  invalid_intervals: "Перевірте робочі інтервали: час початку, завершення та перетини.",
  invalid_weekday: "Некоректний день тижня.",
  invalid_date_range: "Перевірте початкову та кінцеву дати періоду.",
  invalid_status: "Некоректний статус запису.",
  service_master_mismatch: "Послуга недоступна для вибраного майстра.",
  master_unavailable: "Майстер зараз недоступний для запису.",
  master_profile_not_found: "Профіль майстра не знайдено.",
  service_not_found: "Послугу не знайдено. Оновіть список послуг.",
  day_off_not_found: "Період відсутності не знайдено. Оновіть сторінку.",
  dependent_services_conflict: "Зміну категорії блокують пов’язані групи послуг. Спочатку оновіть послуги.",
  active_plan_already_exists: "У вас уже діє цей платний тариф.",
  active_paid_subscription: "У вас діє платний тариф. Замінити його на Free зараз неможливо.",
  existing_free_subscription: "Наявна безкоштовна підписка потребує перевірки. Зверніться до підтримки.",
  trial_already_used: "Ви вже використали пробний період Pro.",
  active_pro_exists: "У вас уже діє підписка Pro.",
  booking_not_finished: "Завершити запис можна лише після закінчення його часу.",
};

//options: RequestInit = {} = об'єкт з параметрами запиту, такими як метод, тіло та signal для скасування. або порожній об'єкт get

export async function api<T>(path: string, options: RequestInit = {}, responseType: "json" | "text" = "json"): Promise<T> {
  // 1. Беремо токен і готуємо заголовки запиту.
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // 2. Відправляємо запит. options містить метод, тіло та signal для скасування.
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 3. Якщо бек повернув помилку, готуємо повідомлення для сторінки.
  if (!res.ok) {
    let message = "Не вдалося виконати запит.";
    if (res.status === 401) message = "Увійдіть у свій акаунт повторно.";
    if (res.status === 403) message = "У вас немає доступу до цієї дії.";
    if (res.status === 404) message = "Запитані дані не знайдено.";
    if (res.status === 409) message = "Дію неможливо виконати через конфлікт даних. Оновіть сторінку.";

    // Читаємо тіло лише один раз: це може бути JSON або звичайний текст помилки.
    const body = (await res.text()).trim();

    let data: Record<string, unknown> = {};

    let text = "";

    try {
      const parsed: unknown = JSON.parse(body);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      } else if (typeof parsed === "string") {
        text = parsed.trim();
      }
    } catch {
      // Пошкоджений JSON не показуємо користувачу.
      if (!body.startsWith("{") && !body.startsWith("[")) {
        text = body;
      }
    }
    // HTML-сторінку помилки від сервера не показуємо як повідомлення.
    if (text && !text.includes("<")) {
      message = text;
    }

    //{ "error": "pending_booking_expired" }.
    let code: string | undefined;
    if (typeof data.error === "string") {
      code = data.error.trim() || undefined;
    }

    // Деякі відповіді додатково містять пояснення в полі message.
    if (typeof data.message === "string" && data.message.trim()) {
      message = data.message.trim();
    }

    // Помилки валідації: { "errors": { "Phone": ["Вкажіть телефон."] } }.
    // Форми зараз показують спільне повідомлення, тому назви полів не зберігаємо.
    const messages: string[] = [];
    if (typeof data.errors === "object" && data.errors !== null && !Array.isArray(data.errors)) {
      for (const [field, values] of Object.entries(data.errors)) {
        if (!Array.isArray(values)) continue;

        for (const value of values) {
          if (typeof value === "string" && value.trim()) {
            // ASP.NET повертає англійські помилки координат без окремого коду.
            const fieldName = field.split(".").pop()?.toLowerCase();
            if (fieldName === "latitude" || fieldName === "longitude") {
              const coordinatesMessage = "Не вдалося зберегти координати адреси. Спробуйте вибрати адресу повторно.";
              if (!messages.includes(coordinatesMessage)) {
                messages.push(coordinatesMessage);
              }
            } else {
              messages.push(value.trim());
            }
          }
        }
      }
    }
    if (messages.length > 0) {
      message = messages.join(" ");
    }

    // Ці відповіді реєстрації поки містять лише текст, без коду помилки.
    if (
      message === "User with the same Email already exists" ||
      message === "User already exists with the same Email."
    ) {
      message = "Користувач із такою електронною адресою вже існує.";
    }

    if (message === "This Email is already on confirmation.") {
      message = "Для цієї електронної адреси вже було розпочато підтвердження реєстрації.";
    }

    // Якщо знаємо код — показуємо його український переклад зі словника.
    if (code && Object.hasOwn(ERROR_MESSAGES, code)) message = ERROR_MESSAGES[code];

    if (res.status === 429) message = "Забагато запитів. Зачекайте трохи та повторіть спробу.";
    if (res.status >= 500) message = "Помилка сервера. Спробуйте пізніше.";

    throw new ApiError(message, res.status, { code });
  }

  // 4. Повертаємо успішний результат: без тіла, текст або JSON.
  if (res.status === 204) return undefined as T; //бек не прислав дані наприклад видалення або оновлення без повернення об'єкта
  if (responseType === "text") return (await res.text()) as T; // повертаємо текст, якщо очікуємо текст
  return res.json();
}
