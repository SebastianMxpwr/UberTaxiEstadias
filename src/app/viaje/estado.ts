export type Estado = 'solicitado' | 'aceptado' | 'en_camino' | 'en_curso' | 'terminado' | 'cancelado';
export type LngLat = [number, number];
export interface Quien { rol: 'pasajero' | 'conductor'; id: string }
export interface Lugar { nombre: string; lngLat: LngLat }
export interface Viaje {
  id: string; estado: Estado; pasajero: string; conductor?: string;
  origen: Lugar; destino: Lugar; costo: number;
  rutaRecogida: LngLat[]; rutaViaje: LngLat[]; posicion?: LngLat;
  historial: { estado: Estado; en: number; por: string }[];
}

const SIGUIENTE: Partial<Record<Estado, Estado>> = {
  aceptado: 'en_camino', en_camino: 'en_curso', en_curso: 'terminado',
};
const CANCELABLES: Estado[] = ['solicitado', 'aceptado', 'en_camino'];

/** Devuelve el motivo por el que no se puede, o undefined si se puede. */
function motivo(v: Viaje, a: Estado, q: Quien): string | undefined {
  if (a === 'solicitado') return 'Estado de destino no válido';
  if (a === 'aceptado') {
    if (v.estado !== 'solicitado') return 'Este viaje ya lo tomó otro conductor';
    return q.rol === 'conductor' ? undefined : 'Solo un conductor puede aceptar el viaje';
  }
  if (a === 'cancelado') {
    if (!CANCELABLES.includes(v.estado)) return 'Este viaje ya no se puede cancelar';
    const esDuenio = q.rol === 'pasajero' && q.id === v.pasajero;
    const esConductor = q.rol === 'conductor' && q.id === v.conductor;
    return esDuenio || esConductor ? undefined : 'No puedes cancelar este viaje';
  }
  if (SIGUIENTE[v.estado] !== a) return `No se puede pasar de ${v.estado} a ${a}`;
  return q.rol === 'conductor' && q.id === v.conductor ? undefined : 'Solo el conductor asignado puede avanzar el viaje';
}

export function puedeIr(v: Viaje, a: Estado, quien: Quien): boolean {
  return motivo(v, a, quien) === undefined;
}

export function transicion(v: Viaje, a: Estado, quien: Quien, ahora = Date.now()): Viaje {
  const m = motivo(v, a, quien);
  if (m) throw new Error(m);
  return {
    ...v,
    estado: a,
    conductor: a === 'aceptado' ? quien.id : v.conductor,
    posicion: a === 'en_camino' ? v.rutaRecogida[0] : v.posicion,
    historial: [...v.historial, { estado: a, en: ahora, por: quien.id }],
  };
}
