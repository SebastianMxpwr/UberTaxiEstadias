import { Injectable, signal } from '@angular/core';
import { Estado } from './viaje/estado';

const CLAVE = 'traslados:sonido';
type Cambio = 'inicio' | 'fin';

/** Qué suena al pasar de `antes` a `ahora` (la primera lectura, sin `antes`, no suena). */
export function sonidoDeCambio(rol: 'pasajero' | 'conductor', antes?: Estado, ahora?: Estado): Cambio | undefined {
  if (!antes || !ahora || antes === ahora) return undefined;
  if (ahora === 'terminado') return 'fin';
  if (ahora === 'en_curso' || (rol === 'pasajero' && ahora === 'aceptado')) return 'inicio';
  return undefined;
}

/** Hay un id que no estaba en la lectura anterior (`antes` undefined = carga inicial, no cuenta). */
export function hayNuevo(antes: string[] | undefined, ahora: string[]): boolean {
  return !!antes && ahora.some((id) => !antes.includes(id));
}

/** Sonidos sintetizados con Web Audio (sin archivos). El navegador exige un gesto antes de poder sonar. */
@Injectable({ providedIn: 'root' })
export class Sonido {
  readonly activo = signal(leer() !== '0');
  private ctx?: AudioContext;

  constructor() {
    const gesto = () => {
      removeEventListener('pointerdown', gesto, true);
      removeEventListener('keydown', gesto, true);
      this.ctx ??= new AudioContext();
      void this.ctx.resume();
    };
    addEventListener('pointerdown', gesto, true);
    addEventListener('keydown', gesto, true);
  }

  alternar(): void {
    this.activo.update((a) => !a);
    try { localStorage.setItem(CLAVE, this.activo() ? '1' : '0'); } catch { /* sin almacenamiento: queda en memoria */ }
  }

  nuevoViaje(): void { for (const t of [0, 0.55]) this.notas([880, 1320], t, 0.14, 0.4, 'sine'); }
  inicio(): void { this.notas([523.25, 659.25, 783.99], 0, 0.08, 0.5, 'triangle'); }
  fin(): void { this.notas([783.99, 659.25, 523.25], 0, 0.17, 0.5, 'sine'); }
  error(): void { this.notas([150], 0, 0, 0.3, 'triangle'); }

  private notas(frecuencias: number[], desde: number, paso: number, dur: number, tipo: OscillatorType): void {
    const ctx = this.ctx;
    if (!this.activo() || !ctx || ctx.state !== 'running') return; // sin gesto previo: se ignora
    frecuencias.forEach((f, i) => {
      const t = ctx.currentTime + desde + i * paso;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = tipo;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.015); // ataque corto: sin clic
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    });
  }
}

function leer(): string | null {
  try { return localStorage.getItem(CLAVE); } catch { return null; }
}
