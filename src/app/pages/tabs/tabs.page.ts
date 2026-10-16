import { Component, inject } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, listOutline, barChartOutline } from 'ionicons/icons';
import { FinanzasService } from '../../services/finanzas.service';

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="mes">
          <ion-icon name="calendar-outline" aria-hidden="true"></ion-icon>
          <ion-label>Mes</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="movimientos">
          <ion-icon name="list-outline" aria-hidden="true"></ion-icon>
          <ion-label>Movimientos</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="resumen">
          <ion-icon name="bar-chart-outline" aria-hidden="true"></ion-icon>
          <ion-label>Resumen</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  // Se inyecta aquí para que empiece a escuchar tus datos apenas entras
  private finanzas = inject(FinanzasService);

  constructor() {
    addIcons({ calendarOutline, listOutline, barChartOutline });
  }
}
