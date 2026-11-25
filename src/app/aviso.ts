import { Injectable, inject, signal } from '@angular/core';
import { Sonido } from './sonido';

/** Aviso de error que se va solo a los 4 s. */
@Injectable({ providedIn: 'root' })
export class Aviso {
  readonly texto = signal('');
  private readonly sonido = inject(Sonido);
  private temporizador?: ReturnType<typeof setTimeout>;

  mostrar(texto: string): void {
    clearTimeout(this.temporizador);
    this.sonido.error();
    this.texto.set(texto);
    this.temporizador = setTimeout(() => this.texto.set(''), 4000);
  }
}
