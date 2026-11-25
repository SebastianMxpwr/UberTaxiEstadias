import { describe, it, expect } from 'vitest';
import { puntoEnRuta, longitudKm } from './ruta';
import { LngLat } from './estado';

// Dos tramos desiguales sobre el ecuador: 1 grado y 3 grados de longitud.
const ruta: LngLat[] = [[0, 0], [1, 0], [4, 0]];

describe('ruta', () => {
  it('longitudKm suma los tramos (~111 km por grado en el ecuador)', () => {
    expect(longitudKm(ruta)).toBeCloseTo(4 * 111.19, 0);
  });
  it('t<=0 es el primer punto y t>=1 el último', () => {
    expect(puntoEnRuta(ruta, -1)).toEqual([0, 0]);
    expect(puntoEnRuta(ruta, 0)).toEqual([0, 0]);
    expect(puntoEnRuta(ruta, 1)).toEqual([4, 0]);
    expect(puntoEnRuta(ruta, 2)).toEqual([4, 0]);
  });
  it('t=0.5 es el punto medio por distancia, no por índice', () => {
    const [lng, lat] = puntoEnRuta(ruta, 0.5);
    expect(lng).toBeCloseTo(2, 5);
    expect(lat).toBeCloseTo(0, 5);
  });
});
