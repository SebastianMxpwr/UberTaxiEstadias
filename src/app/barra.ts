import { Component, input, signal } from '@angular/core';

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
  selector: 'app-barra',
  imports: [BotonTema],
  template: `
    <header class="barra">
      <img src="taxi.png" alt="" />
      <strong class="marca">Traslados</strong>
      <span class="etiqueta">{{ rol() }}</span>
      <app-boton-tema />
    </header>
  `,
})
export class Barra {
  readonly rol = input.required<string>();
}
