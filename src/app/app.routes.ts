import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from './services/auth.service';

// Solo deja pasar si hay sesión iniciada
const conSesion: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.listo;
  return auth.usuario() ? true : router.parseUrl('/login');
};

// Si ya iniciaste sesión, el login te manda directo a la app
const sinSesion: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.listo;
  return auth.usuario() ? router.parseUrl('/tabs/mes') : true;
};

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [sinSesion],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'armar',
    canActivate: [conSesion],
    loadComponent: () => import('./pages/armar/armar.page').then((m) => m.ArmarPage),
  },
  {
    path: 'tabs',
    canActivate: [conSesion],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'mes',
        loadComponent: () => import('./pages/mes/mes.page').then((m) => m.MesPage),
      },
      {
        path: 'movimientos',
        loadComponent: () =>
          import('./pages/movimientos/movimientos.page').then((m) => m.MovimientosPage),
      },
      {
        path: 'resumen',
        loadComponent: () => import('./pages/resumen/resumen.page').then((m) => m.ResumenPage),
      },
      { path: '', redirectTo: 'mes', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/mes', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/mes' },
];
