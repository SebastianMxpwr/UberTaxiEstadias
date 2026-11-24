import { signal } from '@angular/core';
import { AlmacenViajes } from './almacen';
import { Estado, LngLat, Quien, Viaje } from './estado';
import { puntoEnRuta } from './ruta';

const TRAMO_MS = 20000;
const PASO_MS = 250;

/** ?vel=N divide la duración de cada tramo entre N (para las pruebas). */
export function velocidad(): number {
  const n = Number(new URLSearchParams(location.search).get('vel'));
  return n > 0 ? n : 1;
}

/** Identidad por pestaña: pasajero-xxxx / conductor-xxxx. */
export function identidad(rol: Quien['rol']): Quien {
  const k = `traslados:id:${rol}`;
  let id = sessionStorage.getItem(k);
  if (!id) sessionStorage.setItem(k, (id = `${rol}-${Math.random().toString(36).slice(2, 6)}`));
  return { rol, id };
}

function animar(almacen: AlmacenViajes, id: string, ruta: LngLat[], alLlegar: () => void): () => void {
  const paso = PASO_MS / (TRAMO_MS / velocidad());
  let t = 0;
  const timer = setInterval(() => {
    t = Math.min(1, t + paso);
    almacen.posicion(id, puntoEnRuta(ruta, t)).catch(() => undefined);
    if (t >= 1) {
      clearInterval(timer);
      alLlegar();
    }
  }, PASO_MS);
  return () => clearInterval(timer);
}

/** Mueve el coche mientras el viaje de este conductor está en_camino o en_curso. */
export class MotorConductor {
  readonly llego = signal(false);
  private parar?: () => void;
  private tramo?: Estado;

  constructor(private readonly almacen: AlmacenViajes, private readonly quien: Quien) {}

  alCambiar(v: Viaje | undefined): void {
    const mueve = v && v.conductor === this.quien.id && (v.estado === 'en_camino' || v.estado === 'en_curso');
    if (!mueve) return this.destruir();
    if (this.tramo === v.estado) return;
    this.destruir();
    this.tramo = v.estado;
    const ruta = v.estado === 'en_camino' ? v.rutaRecogida : v.rutaViaje;
    this.parar = animar(this.almacen, v.id, ruta, () => this.llego.set(true));
  }

  destruir(): void {
    this.parar?.();
    this.parar = this.tramo = undefined;
    this.llego.set(false);
  }
}
