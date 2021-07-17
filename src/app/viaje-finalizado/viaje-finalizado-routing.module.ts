import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViajeFinalizadoPage } from './viaje-finalizado.page';

const routes: Routes = [
  {
    path: '',
    component: ViajeFinalizadoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViajeFinalizadoPageRoutingModule {}
