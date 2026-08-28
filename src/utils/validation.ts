export function validateName(value: string): string {
  const v = value.trim();
  if (!v) return "Вкажіть ім'я";
  if (v.length < 2) return "Занадто коротке ім'я";
  if (v.length > 60) return "Занадто довге ім'я";
  if (/\d/.test(v)) return "Ім'я не може містити цифри";
  return "";
}

export function validateEmail(value: string): string {
  if (!value.trim()) return "Вкажіть email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Некоректний email";
  return "";
}

export function validatePassword(value: string): string {
  if (!value) return "Вкажіть пароль";
  if (value.length < 8) return "Мінімум 8 символів";
  return "";
}

export function validateConfirmPassword(value: string, password: string): string {
  if (value !== password) return "Паролі не збігаються";
  return "";
}

export function validatePhone(value: string): string {
  if (!/^\+380\d{9}$/.test(value)) return "Формат: +380XXXXXXXXX";
  return "";
}