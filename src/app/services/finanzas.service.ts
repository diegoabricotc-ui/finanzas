import { Injectable, effect, inject, signal } from '@angular/core';
import {
  Timestamp,
  Unsubscribe,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ID_EMERGENCIA, Mes, Movimiento } from '../models';
import { llaveMes, mesAnterior } from '../util';
import { saldoFondo } from '../calculos';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FinanzasService {
  private auth = inject(AuthService);

  /** Llave del mes de hoy, ej. '2026-10' */
  readonly llaveActual = llaveMes();

  /** Mes actual. undefined = cargando, null = todavía no lo armas */
  readonly mes = signal<Mes | null | undefined>(undefined);

  /** Gastos del mes actual, el más nuevo primero */
  readonly movimientos = signal<Movimiento[]>([]);

  private desuscribir: Unsubscribe[] = [];

  constructor() {
    // Cada vez que cambia el usuario (entra / sale), escuchamos sus datos en vivo
    effect(() => {
      const usuario = this.auth.usuario();
      this.desuscribir.forEach((d) => d());
      this.desuscribir = [];
      this.mes.set(undefined);
      this.movimientos.set([]);
      if (usuario) this.escuchar(usuario.uid);
    });
  }

  // ---------- Rutas en Firestore ----------
  private colMeses(uid = this.auth.uid) {
    return collection(db, 'usuarios', uid, 'meses');
  }
  private colMovimientos(uid = this.auth.uid) {
    return collection(db, 'usuarios', uid, 'movimientos');
  }

  // ---------- Escucha en vivo ----------
  private escuchar(uid: string) {
    const refMes = doc(this.colMeses(uid), this.llaveActual);
    this.desuscribir.push(
      onSnapshot(refMes, (snap) => {
        this.mes.set(snap.exists() ? ({ id: snap.id, ...snap.data() } as Mes) : null);
      }),
    );

    const q = query(this.colMovimientos(uid), where('mes', '==', this.llaveActual));
    this.desuscribir.push(
      onSnapshot(q, (snap) => {
        this.movimientos.set(ordenar(snap.docs.map(aMovimiento)));
      }),
    );
  }

  // ---------- Meses ----------
  async obtenerMes(llave: string): Promise<Mes | null> {
    const snap = await getDoc(doc(this.colMeses(), llave));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Mes) : null;
  }

  /** Mes anterior (para copiar presupuestos y traer lo que sobró) */
  obtenerMesAnterior(llave = this.llaveActual) {
    return this.obtenerMes(mesAnterior(llave));
  }

  async listarMeses(): Promise<Mes[]> {
    const snap = await getDocs(this.colMeses());
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Mes)
      .sort((a, b) => b.id.localeCompare(a.id));
  }

  guardarMes(mes: Mes) {
    const { id, ...datos } = mes;
    return setDoc(doc(this.colMeses(), id), datos);
  }

  cerrarMes(mes: Mes, saldoReal: number | null, sobrante: number, destino: Mes['destinoSobrante']) {
    return this.guardarMes({ ...mes, cerrado: true, saldoReal, sobrante, destinoSobrante: destino });
  }

  reabrirMes(mes: Mes) {
    return this.guardarMes({ ...mes, cerrado: false });
  }

  // ---------- Movimientos ----------
  agregarMovimiento(m: Omit<Movimiento, 'id'>) {
    return addDoc(this.colMovimientos(), { ...m, fecha: Timestamp.fromDate(m.fecha) });
  }

  borrarMovimiento(id: string) {
    return deleteDoc(doc(this.colMovimientos(), id));
  }

  async movimientosDe(llave: string): Promise<Movimiento[]> {
    const q = query(this.colMovimientos(), where('mes', '==', llave));
    const snap = await getDocs(q);
    return ordenar(snap.docs.map(aMovimiento));
  }

  // ---------- Fondo de emergencia ----------
  async saldoFondoEmergencia(): Promise<number> {
    const meses = await this.listarMeses();
    const q = query(this.colMovimientos(), where('presupuestoId', '==', ID_EMERGENCIA));
    const usos = (await getDocs(q)).docs.map(aMovimiento);
    return saldoFondo(meses, usos, ID_EMERGENCIA);
  }
}

// Convierte un documento de Firestore en Movimiento (Timestamp -> Date)
function aMovimiento(d: { id: string; data: () => Record<string, unknown> }): Movimiento {
  const datos = d.data();
  const fecha = datos['fecha'] instanceof Timestamp ? datos['fecha'].toDate() : new Date();
  return { ...(datos as unknown as Movimiento), id: d.id, fecha };
}

function ordenar(lista: Movimiento[]): Movimiento[] {
  return lista.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
}
