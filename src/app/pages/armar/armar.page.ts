import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { FinanzasService } from '../../services/finanzas.service';
import { ETIQUETAS, Etiqueta, ID_EMERGENCIA, Mes, Presupuesto } from '../../models';
import { PORCENTAJE_SUGERIDO, porAsignar } from '../../calculos';
import { aNumero, clp, idCorto, nombreMes } from '../../util';

// Presupuestos con los que parte la primera vez
const POR_DEFECTO: [string, Etiqueta][] = [
  ['Cuentas y pagos', 'Cuentas'],
  ['Comida', 'Comida'],
  ['Transporte', 'Transporte'],
  ['Salidas', 'Salidas'],
  ['Ocio', 'Ocio'],
];

@Component({
  selector: 'app-armar',
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonFooter,
    IonIcon,
  ],
  templateUrl: './armar.page.html',
  styleUrl: './armar.page.scss',
})
export class ArmarPage implements ViewWillEnter {
  private finanzas = inject(FinanzasService);
  private router = inject(Router);

  readonly etiquetas = ETIQUETAS;
  readonly clp = clp;
  readonly llave = this.finanzas.llaveActual;
  readonly nombre = nombreMes(this.llave);

  cargando = signal(true);
  guardando = signal(false);
  error = signal('');

  // Datos del formulario
  existente: Mes | null = null;
  sueldo = 0;
  arrastre = 0;
  porcentaje = PORCENTAJE_SUGERIDO;
  presupuestos: Presupuesto[] = [];
  editando: string | null = null; // id del presupuesto abierto para editar

  constructor() {
    addIcons({ trashOutline });
  }

  async ionViewWillEnter() {
    this.cargando.set(true);
    this.existente = await this.finanzas.obtenerMes(this.llave);

    if (this.existente) {
      // Editar el mes ya guardado
      const m = this.existente;
      this.sueldo = m.sueldo;
      this.arrastre = m.arrastre ?? 0;
      this.porcentaje = m.porcentajeEmergencia;
      this.presupuestos = m.presupuestos.filter((p) => p.id !== ID_EMERGENCIA).map((p) => ({ ...p }));
    } else {
      // Mes nuevo: copia lo del mes anterior para no partir de cero
      const anterior = await this.finanzas.obtenerMesAnterior();
      this.sueldo = anterior?.sueldo ?? 0;
      this.porcentaje = anterior?.porcentajeEmergencia ?? PORCENTAJE_SUGERIDO;
      this.arrastre =
        anterior?.cerrado && anterior.destinoSobrante === 'siguiente' ? Math.max(0, anterior.sobrante ?? 0) : 0;
      this.presupuestos = anterior
        ? anterior.presupuestos.filter((p) => p.id !== ID_EMERGENCIA).map((p) => ({ ...p }))
        : POR_DEFECTO.map(([nombre, etiqueta]) => ({ id: idCorto(), nombre, etiqueta, monto: 0 }));
    }
    this.cargando.set(false);
  }

  // ---------- Cálculos que se actualizan solos ----------
  get montoEmergencia(): number {
    return Math.round((this.sueldo * this.porcentaje) / 100);
  }

  get emergencia(): Presupuesto {
    return { id: ID_EMERGENCIA, nombre: 'Fondo de emergencia', etiqueta: 'Emergencia', monto: this.montoEmergencia };
  }

  get restante(): number {
    return porAsignar({
      sueldo: this.sueldo,
      arrastre: this.arrastre,
      presupuestos: [this.emergencia, ...this.presupuestos],
    });
  }

  // ---------- Acciones ----------
  cambiarPorcentaje(delta: number) {
    this.porcentaje = Math.min(50, Math.max(0, this.porcentaje + delta));
  }

  agregar() {
    const nuevo: Presupuesto = { id: idCorto(), nombre: '', etiqueta: 'Otro', monto: 0 };
    this.presupuestos = [...this.presupuestos, nuevo];
    this.editando = nuevo.id;
  }

  quitar(id: string) {
    this.presupuestos = this.presupuestos.filter((p) => p.id !== id);
    if (this.editando === id) this.editando = null;
  }

  /** Asigna lo que falta (o quita lo que sobra) a este presupuesto */
  completarCon(p: Presupuesto) {
    p.monto = Math.max(0, p.monto + this.restante);
  }

  // Inputs de plata: muestran 650.000 pero guardan 650000
  mostrar(n: number): string {
    return n ? n.toLocaleString('es-CL') : '';
  }
  leer(valor: string): number {
    return aNumero(valor);
  }

  async guardar() {
    this.error.set('');
    if (this.sueldo <= 0) return this.error.set('Ingresa tu sueldo líquido.');
    if (this.presupuestos.some((p) => !p.nombre.trim()))
      return this.error.set('Hay un presupuesto sin nombre.');
    if (this.restante !== 0) return;

    this.guardando.set(true);
    try {
      const mes: Mes = {
        id: this.llave,
        sueldo: this.sueldo,
        arrastre: this.arrastre,
        porcentajeEmergencia: this.porcentaje,
        presupuestos: [this.emergencia, ...this.presupuestos.map((p) => ({ ...p, nombre: p.nombre.trim() }))],
        cerrado: this.existente?.cerrado ?? false,
        saldoReal: this.existente?.saldoReal ?? null,
        sobrante: this.existente?.sobrante ?? null,
        destinoSobrante: this.existente?.destinoSobrante ?? null,
      };
      // No esperamos la respuesta del servidor: Firestore lo guarda local y sincroniza
      this.finanzas.guardarMes(mes).catch(() => this.error.set('No se pudo guardar. Revisa tu conexión.'));
      await this.router.navigateByUrl('/tabs/mes', { replaceUrl: true });
    } finally {
      this.guardando.set(false);
    }
  }
}
