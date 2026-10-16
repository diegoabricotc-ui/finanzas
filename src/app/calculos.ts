// Toda la matemática de la app en un solo lugar.
// Son funciones "puras": reciben datos y devuelven resultados, sin tocar la base de datos.
import { Mes, Movimiento, Presupuesto, esAhorro } from './models';

export interface EstadoPresupuesto extends Presupuesto {
  gastado: number;
  queda: number; // puede ser negativo si te pasaste
  porcentajeUsado: number; // 0 a 100 (tope visual)
  pasado: boolean;
}

/** Plata total del mes: sueldo + lo que sobró del mes anterior */
export function ingresoTotal(mes: Pick<Mes, 'sueldo' | 'arrastre'>): number {
  return (mes.sueldo || 0) + (mes.arrastre || 0);
}

/** Lo que falta por repartir. Tiene que llegar a 0 para guardar. */
export function porAsignar(mes: Pick<Mes, 'sueldo' | 'arrastre' | 'presupuestos'>): number {
  const asignado = mes.presupuestos.reduce((s, p) => s + (p.monto || 0), 0);
  return ingresoTotal(mes) - asignado;
}

/** Cruza cada presupuesto con los gastos del mes */
export function estadoPresupuestos(mes: Mes, movimientos: Movimiento[]): EstadoPresupuesto[] {
  return mes.presupuestos.map((p) => {
    const gastado = movimientos
      .filter((m) => m.presupuestoId === p.id)
      .reduce((s, m) => s + m.monto, 0);
    const queda = p.monto - gastado;
    const porcentajeUsado = p.monto > 0 ? Math.min(100, (gastado / p.monto) * 100) : gastado > 0 ? 100 : 0;
    return { ...p, gastado, queda, porcentajeUsado, pasado: queda < 0 };
  });
}

/** Lo que te queda para gastar (no cuenta los ahorros) */
export function disponibleParaGastar(estados: EstadoPresupuesto[]): number {
  return estados.filter((e) => !esAhorro(e)).reduce((s, e) => s + e.queda, 0);
}

/** Cuánto puedes gastar por día hasta fin de mes */
export function porDia(disponible: number, hoy = new Date()): number {
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diasRestantes = ultimoDia - hoy.getDate() + 1;
  return Math.max(0, disponible) / diasRestantes;
}

/**
 * Saldo del fondo de emergencia:
 * todo lo que le asignaste mes a mes
 * + sobrantes que mandaste al fondo
 * − lo que usaste (gastos registrados en el fondo)
 */
export function saldoFondo(meses: Mes[], usosFondo: Movimiento[], idFondo: string): number {
  const aportes = meses.reduce((s, m) => {
    const fondo = m.presupuestos.find((p) => p.id === idFondo)?.monto ?? 0;
    const extra = m.cerrado && m.destinoSobrante === 'fondo' ? Math.max(0, m.sobrante ?? 0) : 0;
    return s + fondo + extra;
  }, 0);
  const usos = usosFondo.reduce((s, m) => s + m.monto, 0);
  return aportes - usos;
}

/** Porcentaje sugerido para emergencia */
export const PORCENTAJE_SUGERIDO = 10;

/** Meta del fondo: 3 sueldos */
export const MESES_META_FONDO = 3;
