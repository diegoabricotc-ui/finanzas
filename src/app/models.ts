// Tipos de datos de la app. Así se guardan en Firestore:
//
// usuarios/{uid}/meses/{2026-10}          -> un documento Mes por cada mes
// usuarios/{uid}/movimientos/{idAuto}     -> cada gasto que registras

export type Etiqueta =
  | 'Emergencia'
  | 'Ahorro'
  | 'Cuentas'
  | 'Comida'
  | 'Transporte'
  | 'Salidas'
  | 'Ocio'
  | 'Otro';

export const ETIQUETAS: Etiqueta[] = [
  'Ahorro',
  'Cuentas',
  'Comida',
  'Transporte',
  'Salidas',
  'Ocio',
  'Otro',
];

// Etiquetas que son plata guardada, no plata para gastar
export const ETIQUETAS_AHORRO: Etiqueta[] = ['Emergencia', 'Ahorro'];

export const ID_EMERGENCIA = 'emergencia';

export interface Presupuesto {
  id: string;
  nombre: string;
  etiqueta: Etiqueta;
  monto: number;
}

export type DestinoSobrante = 'fondo' | 'siguiente' | 'nada';

export interface Mes {
  id: string; // formato '2026-10'
  sueldo: number;
  arrastre: number; // plata que sobró del mes anterior y pasó a este
  porcentajeEmergencia: number;
  presupuestos: Presupuesto[];
  cerrado: boolean;
  saldoReal?: number | null;
  sobrante?: number | null;
  destinoSobrante?: DestinoSobrante | null;
}

export interface Movimiento {
  id?: string;
  mes: string;
  presupuestoId: string;
  nombre: string;
  monto: number;
  fecha: Date;
}

export function esAhorro(p: Presupuesto): boolean {
  return ETIQUETAS_AHORRO.includes(p.etiqueta);
}
