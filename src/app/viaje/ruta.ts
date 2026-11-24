import { LngLat } from './estado';

export function distanciaKm([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const r = (g: number) => (g * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export function longitudKm(ruta: LngLat[]): number {
  let km = 0;
  for (let i = 1; i < ruta.length; i++) km += distanciaKm(ruta[i - 1], ruta[i]);
  return km;
}

/** t de 0 a 1, interpolando por distancia acumulada. */
export function puntoEnRuta(ruta: LngLat[], t: number): LngLat {
  if (t <= 0 || ruta.length < 2) return ruta[0];
  if (t >= 1) return ruta[ruta.length - 1];
  let falta = t * longitudKm(ruta);
  for (let i = 1; i < ruta.length; i++) {
    const tramo = distanciaKm(ruta[i - 1], ruta[i]);
    if (falta <= tramo) {
      const f = tramo === 0 ? 0 : falta / tramo;
      const [a, b] = [ruta[i - 1], ruta[i]];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    falta -= tramo;
  }
  return ruta[ruta.length - 1];
}
