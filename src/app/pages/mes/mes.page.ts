import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonModal } from '@ionic/angular';
import { FinanzasService } from '../../services/finanzas.service';
import {
  disponibleParaGastar,
  estadoPresupuestos,
  porDia,
  EstadoPresupuesto,
} from '../../calculos';
import { esAhorro } from '../../models';
import { aNumero, clp, diaMes, esHoy, nombreMes } from '../../util';

@Component({
  selector: 'app-mes',
  imports: [IonContent, IonModal, FormsModule, RouterLink],
  templateUrl: './mes.page.html',
  styleUrl: './mes.page.scss',
})
export class MesPage {
  private finanzas = inject(FinanzasService);

  readonly clp = clp;
  readonly mes = this.finanzas.mes;
  readonly nombre = nombreMes(this.finanzas.llaveActual, false);

  // Todo esto se recalcula solo cuando cambian el mes o los gastos
  readonly estados = computed(() => {
    const mes = this.mes();
    return mes ? estadoPresupuestos(mes, this.finanzas.movimientos()) : [];
  });
  readonly paraGastar = computed(() => this.estados().filter((e) => !esAhorro(e)));
  readonly ahorros = computed(() => this.estados().filter((e) => esAhorro(e)));
  readonly disponible = computed(() => disponibleParaGastar(this.estados()));
  readonly porDia = computed(() => porDia(this.disponible()));
  readonly ultimo = computed(() => this.finanzas.movimientos()[0] ?? null);

  readonly hoy = new Date();
  readonly ultimoDia = new Date(this.hoy.getFullYear(), this.hoy.getMonth() + 1, 0).getDate();

  // ---------- Modal "Nuevo gasto" ----------
  modalAbierto = signal(false);
  monto = 0;
  detalle = '';
  presupuestoId = '';
  fecha = this.fechaInput(new Date());
  errorGasto = signal('');

  abrirGasto(p?: EstadoPresupuesto) {
    this.monto = 0;
    this.detalle = '';
    this.presupuestoId = p?.id ?? this.paraGastar()[0]?.id ?? '';
    this.fecha = this.fechaInput(new Date());
    this.errorGasto.set('');
    this.modalAbierto.set(true);
  }

  get seleccionado(): EstadoPresupuesto | undefined {
    return this.estados().find((e) => e.id === this.presupuestoId);
  }

  mostrar(n: number) {
    return n ? n.toLocaleString('es-CL') : '';
  }
  leer(v: string) {
    return aNumero(v);
  }

  guardarGasto() {
    if (this.monto <= 0) return this.errorGasto.set('Escribe cuánto gastaste.');
    if (!this.detalle.trim()) return this.errorGasto.set('Escribe en qué lo gastaste.');
    if (!this.presupuestoId) return this.errorGasto.set('Elige de qué presupuesto se descuenta.');

    const [a, m, d] = this.fecha.split('-').map(Number);
    const ahora = new Date();
    const fecha = new Date(a, m - 1, d, ahora.getHours(), ahora.getMinutes());

    this.finanzas
      .agregarMovimiento({
        mes: this.finanzas.llaveActual,
        presupuestoId: this.presupuestoId,
        nombre: this.detalle.trim(),
        monto: this.monto,
        fecha,
      })
      .catch(() => this.errorGasto.set('No se pudo guardar.'));
    this.modalAbierto.set(false);
  }

  // ---------- Textos ----------
  cuando(fecha: Date): string {
    return esHoy(fecha) ? `Hoy, ${diaMes(fecha)}` : diaMes(fecha);
  }

  nombrePresupuesto(id: string): string {
    return this.mes()?.presupuestos.find((p) => p.id === id)?.nombre ?? '';
  }

  private fechaInput(f: Date): string {
    const mm = String(f.getMonth() + 1).padStart(2, '0');
    const dd = String(f.getDate()).padStart(2, '0');
    return `${f.getFullYear()}-${mm}-${dd}`;
  }

  get minFecha() {
    return `${this.finanzas.llaveActual}-01`;
  }
  get maxFecha() {
    return `${this.finanzas.llaveActual}-${String(this.ultimoDia).padStart(2, '0')}`;
  }
}
