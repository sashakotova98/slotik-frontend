import { useState, type ChangeEvent } from "react";
import { validateName, validateEmail, validatePassword, validateConfirmPassword, validatePhone } from "../utils/validation";
import Field from "../components/Field";
import { Check } from "lucide-react";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"Client" | "Master">("Client");

  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});


  const validators: Record<string, (value: string) => string> = {
    name: validateName,
    phone: validatePhone,
    email: validateEmail,
    password: validatePassword,
    confirmPassword: (value) => validateConfirmPassword(value, values.password),
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
    if (touched[name]) {
      setErrors({ ...errors, [name]: validators[name](value) });
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validators[name](value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fieldNames = tab === "login"
      ? ["email", "password"]
      : ["name", "phone", "email", "password", "confirmPassword"];

    const newErrors: Record<string, string> = {};
    for (const f of fieldNames) {
      newErrors[f] = validators[f](values[f as keyof typeof values] as string);
    }
    setErrors(newErrors);

    const newTouched: Record<string, boolean> = {};
    for (const f of fieldNames) {
      newTouched[f] = true;
    }
    setTouched(newTouched);

    if (Object.values(newErrors).some((err) => err !== "")) return;
    if (tab === "register" && !values.agree) return;
  }

  const shownError = (field: string) => {
    if (!touched[field]) return "";
    return errors[field] || "";
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-card p-6 shadow-sm">

        <div className="grid grid-cols-2 rounded-field border border-border overflow-hidden mb-6">
          <button
            onClick={() => setTab("login")}
            className={`py-2.5 text-sm font-medium ${tab === "login" ? "bg-accent text-on-accent" : "bg-surface text-text"}`}>
            Вхід
          </button>
          <button
            onClick={() => setTab("register")}
            className={`py-2.5 text-sm font-medium ${tab === "register" ? "bg-accent text-on-accent" : "bg-surface text-text"}`}>
            Реєстрація
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {tab === "login" ? (
            <>
              <Field id="email" name="email" label="Email" type="email" placeholder="oksana@gmail.com"
                value={values.email} onChange={handleInputChange} onBlur={handleBlur} error={shownError("email")} />
              <Field id="password" name="password" label="Пароль" type="password"
                value={values.password} onChange={handleInputChange} onBlur={handleBlur} error={shownError("password")} />
              <p className="text-right mb-4">
                <a href="#" className="text-sm text-accent underline">Забули пароль?</a>
              </p>
            </>
          ) : (
            <>
              <Field id="reg-name" name="name" label="Ім'я" type="text"
                value={values.name} onChange={handleInputChange} onBlur={handleBlur} error={shownError("name")} />
              <Field id="reg-phone" name="phone" label="Телефон" type="tel" placeholder="+380XXXXXXXXX"
                value={values.phone} onChange={handleInputChange} onBlur={handleBlur} error={shownError("phone")} />
              <Field id="reg-email" name="email" label="Email" type="email" placeholder="oksana@gmail.com"
                value={values.email} onChange={handleInputChange} onBlur={handleBlur} error={shownError("email")} />
              <Field id="reg-password" name="password" label="Пароль" type="password" placeholder="мінімум 8 символів"
                value={values.password} onChange={handleInputChange} onBlur={handleBlur} error={shownError("password")} />
              <Field id="reg-confirmPassword" name="confirmPassword" label="Підтвердити пароль" type="password"
                value={values.confirmPassword} onChange={handleInputChange} onBlur={handleBlur} error={shownError("confirmPassword")} />

              <label className="flex items-start gap-2 my-4 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={values.agree}
                  onChange={(e) => setValues({ ...values, agree: e.target.checked })}
                  className="mt-0.5"
                />
                <span>Погоджуюсь з умовами користування та обробкою персональних даних</span>
              </label>

              <div className="grid grid-cols-2 gap-3 my-4">
                <button
                  type="button"
                  onClick={() => setRole("Client")}
                  className={`rounded-field border py-4 text-sm transition-colors ${role === "Client" ? "bg-accent text-on-accent border-accent font-medium" : "bg-surface text-muted border-border"}`}>
                  <span className="flex items-center justify-center gap-1.5">
                    {role === "Client" && <Check size={16} />}
                    Я клієнт
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("Master")}
                  className={`rounded-field border py-4 text-sm transition-colors ${role === "Master" ? "bg-accent text-on-accent border-accent font-medium" : "bg-surface text-muted border-border"}`}>
                  <span className="flex items-center justify-center gap-1.5">
                    {role === "Master" && <Check size={16} />}
                    Я майстер
                  </span>
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={tab === "register" && !values.agree}
            className="w-full bg-accent text-on-accent rounded-field py-3 font-medium mt-2 disabled:opacity-50">
            {tab === "login" ? "Увійти" : "Створити акаунт"}
          </button>
        </form>

      </div>
    </div>
  );
}
