import { useState } from "react"
import { Eye, EyeOff } from "lucide-react";

type FieldProps = {
  label: string;
  id: string;
  name: string;
  type?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function Field({ label, id, name, type = "text", error, ...rest }: FieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  function toggle() {
    setShowPassword(!showPassword)
  }

  const inputType = type === "password" ? (showPassword ? "text" : "password") : type



  return (
    <div className="mb-3">
      <label htmlFor={id} className="block text-sm text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          name={name}
          id={id}
          type={inputType}
          {...rest}
          className={`mt-1 w-full rounded-field border bg-surface px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:border-accent ${error ? "border-danger" : "border-border"
            } ${type === "password" ? "pr-11" : ""}`}
        />
        {type === "password" ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </div>
  );
}