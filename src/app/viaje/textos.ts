import { Estado } from './estado';
import semillas from './rutas-semilla.json';
import { Lugar, LngLat } from './estado';

export interface Semilla {
  nombre: string; costo: number; origen: Lugar; destino: Lugar;
  inicioConductor: LngLat; rutaRecogida: LngLat[]; rutaViaje: LngLat[];
}
export const SEMILLAS = semillas as Semilla[];

export const TEXTO_PASAJERO: Record<Estado, string> = {
  solicitado: 'Buscando conductor',
  aceptado: 'Conductor asignado',
  en_camino: 'Tu conductor va en camino',
  en_curso: 'En viaje',
  terminado: 'Llegaste',
  cancelado: 'Cancelado',
};

export const TEXTO_CONDUCTOR: Record<Estado, string> = {
  solicitado: 'Solicitado',
  aceptado: 'Aceptado',
  en_camino: 'Yendo a recoger',
  en_curso: 'En viaje',
  terminado: 'Terminado',
  cancelado: 'Cancelado',
};
