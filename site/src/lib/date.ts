/** Ключ дня в локальном часовом поясе: 2026-10-18 */
export function dayKey(ts: number = Date.now()) {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function relativeDay(ts: number) {
  const days = Math.round((new Date(dayKey(ts)).getTime() - new Date(dayKey()).getTime()) / 86400000);
  if (days <= 0) return "сегодня";
  if (days === 1) return "завтра";
  return `через ${days} ${plural(days, ["день", "дня", "дней"])}`;
}
