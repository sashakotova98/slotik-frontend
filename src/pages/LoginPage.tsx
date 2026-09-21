import { useState, type ChangeEvent } from "react";
import { validateFirstName, validateLastName, validateEmail, validatePassword, validateConfirmPassword, validatePhone } from "../utils/validation";
import Field from "../components/Field";
import { Check } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { apiLogin, apiRegister } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

export default function LoginPage() {

  const [searchParams] = useSearchParams();

  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const [tab, setTab] = useState<"login" | "register">(
    () => searchParams.get("tab") === "register" ? "register" : "login"
  );
  const [role, setRole] = useState<"Client" | "Master">("Client");

  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});


  const validators: Record<string, (value: string) => string> = {
    firstName: validateFirstName,
    lastName: validateLastName,
    phone: validatePhone,
    email: validateEmail,
    password: validatePassword,
    confirmPassword: (value) => validateConfirmPassword(value, values.password),
  }

  const regFields = ["firstName", "lastName", "phone", "email", "password", "confirmPassword"];
  const isRegFormValid = regFields.every(
    (f) => validators[f](values[f as keyof typeof values] as string) === ""
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldNames = tab === "login"
      ? ["email", "password"]
      : ["firstName", "lastName", "phone", "email", "password", "confirmPassword"];

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

    setLoading(true);
    setServerError("");
    try {
      const data = tab === "login"
        ? await apiLogin(values.email, values.password)
        : await apiRegister({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email,
          phone: values.phone,
          password: values.password,
          role,
        });

      login(data.token, data.role);
      if (data.role === "Superadmin") navigate("/admin", { replace: true });
      else if (data.role === "Master") navigate("/cabinet", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Помилка сервера");
    } finally {
      setLoading(false);
    }
  };

  const shownError = (field: string) => {
    if (!touched[field]) return "";
    return errors[field] || "";
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-card p-6 shadow-sm">

        <div className="grid grid-cols-2 rounded-field border border-border overflow-hidden mb-6">
          <button
            // onClick={() => setTab("login")}
            onClick={() => {
              setTab("login");
              setValues({ firstName: "", lastName: "", phone: "", email: "", password: "", confirmPassword: "", agree: false });
              setErrors({});
              setTouched({});
              setServerError("");
            }}
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
              <Field id="reg-firstName" name="firstName" label="Ім'я" type="text"
                value={values.firstName} onChange={handleInputChange} onBlur={handleBlur} error={shownError("firstName")} />
              <Field id="reg-lastName" name="lastName" label="Прізвище" type="text"
                value={values.lastName} onChange={handleInputChange} onBlur={handleBlur} error={shownError("lastName")} />
              <Field id="reg-phone" name="phone" label="Телефон" type="tel" placeholder="+380XXXXXXXXX"
                value={values.phone} onChange={handleInputChange} onBlur={handleBlur} error={shownError("phone")} />
              <Field id="reg-email" name="email" label="Email" type="email" placeholder="oksana@gmail.com"
                value={values.email} onChange={handleInputChange} onBlur={handleBlur} error={shownError("email")} />
              <Field id="reg-password" name="password" label="Пароль" type="password" placeholder="мінімум 8 символів"
                value={values.password} onChange={handleInputChange} onBlur={handleBlur} error={shownError("password")} />
              <Field id="reg-confirmPassword" name="confirmPassword" label="Підтвердити пароль" type="password"
                value={values.confirmPassword} onChange={handleInputChange} onBlur={handleBlur} error={shownError("confirmPassword")} />

              <label className={`flex items-start gap-2 my-4 text-sm ${isRegFormValid ? "text-muted" : "text-muted opacity-50"}`}>
                <input
                  type="checkbox"
                  checked={values.agree}
                  disabled={!isRegFormValid}
                  onChange={(e) => setValues({ ...values, agree: e.target.checked })}
                  className="mt-0.5"
                />
                <span>Погоджуюсь з умовами користування та обробкою персональних даних</span>
              </label>
              {!isRegFormValid && (
                <p className="text-xs text-muted -mt-2 mb-4">Спочатку заповніть усі поля вище</p>
              )}

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
          {serverError && <p className="text-sm text-danger mb-2 text-center">{serverError}</p>}
          <button
            type="submit"
            disabled={loading || (tab === "register" && !values.agree)}
            className="w-full bg-accent text-on-accent rounded-field py-3 font-medium mt-2 disabled:opacity-50">
            {loading ? "Зачекайте..." : tab === "login" ? "Увійти" : "Створити акаунт"}
          </button>
        </form>
      </div>
    </div>
  );
}


