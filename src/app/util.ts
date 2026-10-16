// Funciones chicas que se usan en varias pantallas

const formatoCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

/** 650000 -> "$650.000" ; -4500 -> "−$4.500" */
export function clp(valor: number | null | undefined): string {
  const v = Math.round(valor ?? 0);
  const texto = formatoCLP.format(Math.abs(v));
  return v < 0 ? '−' + texto : texto;
}

/** Fecha -> "2026-10" (la llave de cada mes en la base de datos) */
export function llaveMes(fecha = new Date()): string {
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}`;
}

/** "2026-10" -> "2026-09" */
export function mesAnterior(llave: string): string {
  const [a, m] = llave.split('-').map(Number);
  return llaveMes(new Date(a, m - 2, 1));
}

/** "2026-10" -> "octubre 2026" */
export function nombreMes(llave: string, conAnio = true): string {
  const [a, m] = llave.split('-').map(Number);
  const texto = new Date(a, m - 1, 1).toLocaleDateString('es-CL', {
    month: 'long',
    ...(conAnio ? { year: 'numeric' } : {}),
  });
  return texto.replace(' de ', ' ');
}

/** Fecha -> "16 de octubre" */
export function diaMes(fecha: Date): string {
  return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
}

export function esHoy(fecha: Date): boolean {
  return fecha.toDateString() === new Date().toDateString();
}

export function idCorto(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Convierte lo que escribes ("1.000", "$1000") a número */
export function aNumero(valor: unknown): number {
  if (typeof valor === 'number') return valor;
  const limpio = String(valor ?? '').replace(/[^\d-]/g, '');
  return Number(limpio) || 0;
}
