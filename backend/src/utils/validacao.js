export function parseValor(valor) {
  const n = typeof valor === "number" ? valor : Number(String(valor).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function parseData(data) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const [ano, mes, dia] = data.split("-").map(Number);
  const date = new Date(Date.UTC(ano, mes - 1, dia));
  if (date.getUTCFullYear() !== ano || date.getUTCMonth() !== mes - 1 || date.getUTCDate() !== dia) return null;
  return date;
}

export function mesAnoDaData(date) {
  return { mes: date.getUTCMonth() + 1, ano: date.getUTCFullYear() };
}
