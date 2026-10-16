import { Component, computed, inject } from '@angular/core';
import { AlertController, IonContent } from '@ionic/angular';
import { FinanzasService } from '../../services/finanzas.service';
import { Movimiento } from '../../models';
import { clp, diaMes, esHoy, nombreMes } from '../../util';

interface Dia {
  titulo: string;
  total: number;
  items: Movimiento[];
}

@Component({
  selector: 'app-movimientos',
  imports: [IonContent],
  templateUrl: './movimientos.page.html',
  styleUrl: './movimientos.page.scss',
})
export class MovimientosPage {
  private finanzas = inject(FinanzasService);
  private alertas = inject(AlertController);

  readonly clp = clp;
  readonly nombre = nombreMes(this.finanzas.llaveActual, false);
  readonly total = computed(() => this.finanzas.movimientos().reduce((s, m) => s + m.monto, 0));

  // Agrupa los gastos por día: "16 de octubre: gastaste $1.000 en Coca-Cola"
  readonly dias = computed<Dia[]>(() => {
    const grupos = new Map<string, Dia>();
    for (const m of this.finanzas.movimientos()) {
      const clave = m.fecha.toDateString();
      if (!grupos.has(clave)) {
        const titulo = esHoy(m.fecha) ? `Hoy, ${diaMes(m.fecha)}` : diaMes(m.fecha);
        grupos.set(clave, { titulo, total: 0, items: [] });
      }
      const g = grupos.get(clave)!;
      g.items.push(m);
      g.total += m.monto;
    }
    return [...grupos.values()];
  });

  nombrePresupuesto(id: string): string {
    return this.finanzas.mes()?.presupuestos.find((p) => p.id === id)?.nombre ?? 'Sin presupuesto';
  }

  async borrar(m: Movimiento) {
    const alerta = await this.alertas.create({
      header: '¿Borrar este gasto?',
      message: `${m.nombre} por ${clp(m.monto)}. La plata vuelve a ${this.nombrePresupuesto(m.presupuestoId)}.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar', role: 'destructive', handler: () => this.finanzas.borrarMovimiento(m.id!) },
      ],
    });
    await alerta.present();
  }
}
