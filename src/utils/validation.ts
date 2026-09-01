function validatePersonName(value: string, lower: string, upper: string): string {
  const v = value.trim();
  if (!v) return `Вкажіть ${lower}`;
  if (v.length < 2) return `Занадто коротке ${lower}`;
  if (v.length > 60) return `Занадто довге ${lower}`;
  if (/\d/.test(v)) return `${upper} не може містити цифри`;
  return "";
}

export function validateFirstName(value: string): string {
  return validatePersonName(value, "ім'я", "Ім'я");
}

export function validateLastName(value: string): string {
  return validatePersonName(value, "прізвище", "Прізвище");
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