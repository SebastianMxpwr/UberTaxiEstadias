import { InjectionToken } from '@angular/core';
import { Estado, LngLat, Quien, Viaje } from './estado';

export interface AlmacenViajes {
  crear(v: Omit<Viaje, 'id'>): Promise<string>;
  observar(id: string, cb: (v: Viaje | undefined) => void): () => void;
  observarSolicitados(cb: (vs: Viaje[]) => void): () => void;
  /** Transaccional: lee lo último, aplica transicion() y escribe. */
  mover(id: string, a: Estado, quien: Quien): Promise<Viaje>;
  /** Solo se guarda si el viaje está en_camino o en_curso; en otro caso se ignora. */
  posicion(id: string, p: LngLat): Promise<void>;
}

export const ALMACEN = new InjectionToken<AlmacenViajes>('ALMACEN');
