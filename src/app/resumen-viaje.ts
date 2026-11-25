import { Component, input } from '@angular/core';
import { Viaje } from './viaje/estado';

/** Estado, origen → destino y costo, igual para pasajero y conductor. */
@Component({
  selector: 'app-resumen-viaje',
  template: `
    @let v = viaje();
    <p class="etiqueta estado" [attr.data-est]="v.estado">
      <span class="led" aria-hidden="true"></span>
      <span data-testid="estado" aria-live="polite">{{ texto() }}</span>
    </p>
    <ul class="lugares">
      <li><span class="icono" aria-hidden="true">trip_origin</span>{{ v.origen.nombre }}</li>
      <li><span class="icono" aria-hidden="true">location_on</span>{{ v.destino.nombre }}</li>
    </ul>
    <p class="costo">$ {{ v.costo }} <small>MXN</small></p>
  `,
  styles: `:host { display: flex; flex-direction: column; gap: .9rem; }`,
})
export class ResumenViaje {
  readonly viaje = input.required<Viaje>();
  readonly texto = input.required<string>();
}
