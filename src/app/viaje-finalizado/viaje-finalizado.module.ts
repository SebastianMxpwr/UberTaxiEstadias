import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ViajeFinalizadoPageRoutingModule } from './viaje-finalizado-routing.module';

import { ViajeFinalizadoPage } from './viaje-finalizado.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ViajeFinalizadoPageRoutingModule
  ],
  declarations: [ViajeFinalizadoPage]
})
export class ViajeFinalizadoPageModule {}
