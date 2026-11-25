import { Component, inject, input, signal } from '@angular/core';
import { Sonido } from './sonido';

@Component({
  selector: 'app-boton-tema',
  template: `<button type="button" class="btn btn-texto mini" aria-label="Cambiar tema" (click)="cambiar()"><span class="icono" aria-hidden="true">{{ tema() === 'oscuro' ? 'light_mode' : 'dark_mode' }}</span></button>`,
})
export class BotonTema {
  protected readonly tema = signal(document.documentElement.dataset['tema'] ?? 'claro');

  protected cambiar(): void {
    (window as unknown as { pvTema(cambiar: boolean): void }).pvTema(true);
    this.tema.set(document.documentElement.dataset['tema'] ?? 'claro');
  }
}

@Component({
  selector: 'app-boton-sonido',
  template: `<button type="button" class="btn btn-texto mini" aria-label="Sonido" [attr.aria-pressed]="sonido.activo()" (click)="sonido.alternar()"><span class="icono" aria-hidden="true">{{ sonido.activo() ? 'notifications_active' : 'notifications_off' }}</span></button>`,
})
export class BotonSonido {
  protected readonly sonido = inject(Sonido);
}

@Component({
  selector: 'app-barra',
  imports: [BotonTema, BotonSonido],
  template: `
    <header class="barra">
      <img src="taxi.png" alt="" />
      <strong class="marca">Traslados</strong>
      <span class="etiqueta">{{ rol() }}</span>
      <app-boton-sonido />
      <app-boton-tema />
    </header>
  `,
})
export class Barra {
  readonly rol = input.required<string>();
}
