import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pantallas/inicio').then((m) => m.Inicio) },
  { path: 'pasajero', loadComponent: () => import('./pantallas/pasajero').then((m) => m.Pasajero) },
  { path: 'conductor', loadComponent: () => import('./pantallas/conductor').then((m) => m.Conductor) },
  { path: '**', redirectTo: '' },
];
