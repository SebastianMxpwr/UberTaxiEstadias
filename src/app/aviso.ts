import { Injectable, signal } from '@angular/core';

/** Aviso de error que se va solo a los 4 s. */
@Injectable({ providedIn: 'root' })
export class Aviso {
  readonly texto = signal('');
  private temporizador?: ReturnType<typeof setTimeout>;

  mostrar(texto: string): void {
    clearTimeout(this.temporizador);
    this.texto.set(texto);
    this.temporizador = setTimeout(() => this.texto.set(''), 4000);
  }
}
