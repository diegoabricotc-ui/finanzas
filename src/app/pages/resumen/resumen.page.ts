import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, ViewWillEnter } from '@ionic/angular';
import { FinanzasService } from '../../services/finanzas.service';
import { AuthService } from '../../services/auth.service';
import { DestinoSobrante, Mes, Movimiento, esAhorro } from '../../models';
import { MESES_META_FONDO, estadoPresupuestos } from '../../calculos';
import { aNumero, clp, nombreMes } from '../../util';

@Component({
  selector: 'app-resumen',
  imports: [IonContent, FormsModule],
  templateUrl: './resumen.page.html',
  styleUrl: './resumen.page.scss',
})
export class ResumenPage implements ViewWillEnter {
  private finanzas = inject(FinanzasService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly clp = clp;
  readonly nombreMes = nombreMes;
  readonly mesesMeta = MESES_META_FONDO;

  meses = signal<Mes[]>([]);
  llave = signal(this.finanzas.llaveActual);
  private mesOtro = signal<Mes | null>(null);
  private movsOtro = signal<Movimiento[]>([]);
  saldoFondo = signal(0);

  // Si miras el mes actual usamos los datos en vivo; si es otro, los cargados
  readonly esActual = computed(() => this.llave() === this.finanzas.llaveActual);
  readonly mes = computed(() => (this.esActual() ? this.finanzas.mes() ?? null : this.mesOtro()));
  readonly movimientos = computed(() => (this.esActual() ? this.finanzas.movimientos() : this.movsOtro()));

  readonly estados = computed(() => {
    const m = this.mes();
    return m ? estadoPresupuestos(m, this.movimientos()) : [];
  });
  readonly gastos = computed(() => this.estados().filter((e) => !esAhorro(e)));
  readonly escala = computed(() => Math.max(1, ...this.gastos().flatMap((e) => [e.monto, e.gastado])));
  readonly deberiaSobrar = computed(() => this.gastos().reduce((s, e) => s + e.queda, 0));
  readonly mejor = computed(() => {
    const ok = this.gastos().filter((e) => e.queda > 0);
    return ok.length ? ok.reduce((a, b) => (b.queda > a.queda ? b : a)) : null;
  });
  readonly aCuidar = computed(() => {
    const malos = this.gastos().filter((e) => e.pasado);
    return malos.length ? malos.reduce((a, b) => (b.queda < a.queda ? b : a)) : null;
  });
  readonly metaFondo = computed(() => (this.mes()?.sueldo ?? 0) * MESES_META_FONDO);
  readonly avanceFondo = computed(() =>
    this.metaFondo() ? Math.min(100, Math.max(0, (this.saldoFondo() / this.metaFondo()) * 100)) : 0,
  );

  // Formulario de cierre
  saldoReal: number | null = null;
  destino: DestinoSobrante = 'fondo';
  guardando = signal(false);

  get diferencia(): number | null {
    return this.saldoReal === null ? null : this.saldoReal - this.deberiaSobrar();
  }

  async ionViewWillEnter() {
    const meses = await this.finanzas.listarMeses();
    this.meses.set(meses);
    this.saldoFondo.set(await this.finanzas.saldoFondoEmergencia());
    await this.elegirMes(this.llave());
  }

  async elegirMes(llave: string) {
    this.llave.set(llave);
    if (!this.esActual()) {
      this.mesOtro.set(await this.finanzas.obtenerMes(llave));
      this.movsOtro.set(await this.finanzas.movimientosDe(llave));
    }
    const m = this.mes();
    this.saldoReal = m?.saldoReal ?? null;
    this.destino = m?.destinoSobrante ?? 'fondo';
  }

  ancho(valor: number): number {
    return Math.max(0, (valor / this.escala()) * 100);
  }

  mostrar(n: number | null) {
    return n ? n.toLocaleString('es-CL') : '';
  }
  leerSaldo(v: string) {
    this.saldoReal = String(v).trim() === '' ? null : aNumero(v);
  }

  async cerrar() {
    const m = this.mes();
    if (!m) return;
    this.guardando.set(true);
    try {
      const sobrante = Math.max(0, this.deberiaSobrar());
      await this.finanzas.cerrarMes(m, this.saldoReal, sobrante, this.destino);
      if (!this.esActual()) this.mesOtro.set({ ...m, cerrado: true, saldoReal: this.saldoReal, sobrante, destinoSobrante: this.destino });
      this.saldoFondo.set(await this.finanzas.saldoFondoEmergencia());
      this.meses.set(await this.finanzas.listarMeses());
    } finally {
      this.guardando.set(false);
    }
  }

  async reabrir() {
    const m = this.mes();
    if (!m) return;
    await this.finanzas.reabrirMes(m);
    if (!this.esActual()) this.mesOtro.set({ ...m, cerrado: false });
    this.saldoFondo.set(await this.finanzas.saldoFondoEmergencia());
  }

  async salir() {
    await this.auth.salir();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
