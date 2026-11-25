import { describe, it, expect } from 'vitest';
import { parsearOsrm, parsearPhoton, tarifa } from './lugares';

describe('tarifa', () => {
  it('banderazo + km, redondeada al peso', () => {
    expect(tarifa(10)).toBe(120);
    expect(tarifa(5.23)).toBe(79); // 35 + 44.455 = 79.455
  });
  it('mínimo 45', () => {
    expect(tarifa(0)).toBe(45);
    expect(tarifa(0.5)).toBe(45);
  });
});

describe('parsearPhoton', () => {
  const json = {
    features: [
      { geometry: { coordinates: [-99.1332, 19.4326] }, properties: { name: 'Zócalo', district: 'Centro' } },
      { geometry: { coordinates: [-99.17, 19.38] }, properties: { street: 'Insurgentes Sur', housenumber: '1000', locality: 'Del Valle' } },
      { geometry: { coordinates: [-99.1, 19.4] }, properties: { osm_key: 'highway' } },
    ],
  };
  it('usa name o calle + número, con el barrio como detalle, y descarta lo anónimo', () => {
    expect(parsearPhoton(json)).toEqual([
      { nombre: 'Zócalo', detalle: 'Centro', lngLat: [-99.1332, 19.4326] },
      { nombre: 'Insurgentes Sur 1000', detalle: 'Del Valle', lngLat: [-99.17, 19.38] },
    ]);
  });
  it('sin features devuelve lista vacía', () => {
    expect(parsearPhoton({})).toEqual([]);
  });
});

describe('parsearOsrm', () => {
  const ok = { code: 'Ok', routes: [{ distance: 5230.4, duration: 780.2, geometry: { coordinates: [[-99.13, 19.43], [-99.16, 19.42]] as [number, number][] } }] };
  it('extrae geometría, km y minutos', () => {
    const r = parsearOsrm(ok);
    expect(r.ruta).toEqual([[-99.13, 19.43], [-99.16, 19.42]]);
    expect(r.km).toBeCloseTo(5.2304, 4);
    expect(r.min).toBe(13);
  });
  it('lanza si no hay ruta', () => {
    expect(() => parsearOsrm({ code: 'NoRoute', routes: [] })).toThrow();
  });
});
