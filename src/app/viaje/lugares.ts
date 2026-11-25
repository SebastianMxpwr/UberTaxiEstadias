import { LngLat, Lugar } from './estado';

// Servicios públicos y sin llave: Photon (OSM) para direcciones y OSRM para rutas. Uso razonable (demo).
const PHOTON = 'https://photon.komoot.io';
const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const BBOX = '-99.40,19.15,-98.90,19.65'; // Valle de México
const KM_RECOGIDA = 1.2;

export interface Sugerencia extends Lugar { detalle: string }
export interface Ruta { ruta: LngLat[]; km: number; min: number }
export interface Rutas { rutaViaje: LngLat[]; rutaRecogida: LngLat[]; km: number; min: number }

/** Banderazo 35 + 8.5 por km, al peso, mínimo 45. */
export function tarifa(km: number): number {
  return Math.max(45, Math.round(35 + 8.5 * km));
}

interface FeaturePhoton {
  geometry?: { coordinates?: number[] };
  properties?: Record<string, string | undefined>;
}

/** Respuesta de Photon (búsqueda o inverso) a sugerencias; descarta lo que no tiene nombre ni coordenadas. */
export function parsearPhoton(json: { features?: FeaturePhoton[] }): Sugerencia[] {
  return (json.features ?? []).flatMap((f) => {
    const p = f.properties ?? {};
    const [lng, lat] = f.geometry?.coordinates ?? [];
    const calle = [p['street'], p['housenumber']].filter(Boolean).join(' ');
    const nombre = p['name'] || calle;
    if (!nombre || typeof lng !== 'number' || typeof lat !== 'number') return [];
    const zona = p['district'] || p['locality'] || p['city'] || '';
    return [{ nombre, detalle: zona === nombre ? '' : zona, lngLat: [lng, lat] as LngLat }];
  });
}

/** Respuesta de OSRM a la primera ruta. */
export function parsearOsrm(json: { code?: string; routes?: { distance: number; duration: number; geometry: { coordinates: LngLat[] } }[] }): Ruta {
  const r = json.routes?.[0];
  if (json.code !== 'Ok' || !r) throw new Error('Sin ruta');
  return { ruta: r.geometry.coordinates, km: r.distance / 1000, min: Math.max(1, Math.round(r.duration / 60)) };
}

async function pedirJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function buscar(texto: string, signal?: AbortSignal): Promise<Sugerencia[]> {
  const q = new URLSearchParams({ q: texto, limit: '5', bbox: BBOX, lat: '19.43', lon: '-99.13' });
  return parsearPhoton(await pedirJson(`${PHOTON}/api/?${q}`, signal));
}

/** Nombre de un punto tocado en el mapa; si falla, "Punto en el mapa". */
export async function nombrarPunto([lng, lat]: LngLat): Promise<string> {
  try {
    return parsearPhoton(await pedirJson(`${PHOTON}/reverse?lat=${lat}&lon=${lng}`))[0]?.nombre ?? 'Punto en el mapa';
  } catch {
    return 'Punto en el mapa';
  }
}

async function ruta(a: LngLat, b: LngLat): Promise<Ruta> {
  return parsearOsrm(await pedirJson(`${OSRM}/${a.join(',')};${b.join(',')}?overview=full&geometries=geojson`));
}

/** Punto a ~1.2 km de `p` en dirección aleatoria: dónde "empieza" el conductor. */
function inicioConductor([lng, lat]: LngLat): LngLat {
  const a = Math.random() * 2 * Math.PI;
  const grado = KM_RECOGIDA / 111.2;
  return [lng + (grado * Math.sin(a)) / Math.cos((lat * Math.PI) / 180), lat + grado * Math.cos(a)];
}

/** Ruta del viaje (origen → destino) y de recogida (conductor → origen). Lanza si OSRM falla. */
export async function calcularRutas(origen: LngLat, destino: LngLat): Promise<Rutas> {
  const [viaje, recogida] = await Promise.all([ruta(origen, destino), ruta(inicioConductor(origen), origen)]);
  return { rutaViaje: viaje.ruta, rutaRecogida: recogida.ruta, km: viaje.km, min: viaje.min };
}
