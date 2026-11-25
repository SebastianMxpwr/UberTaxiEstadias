import { aDoc, deDoc } from './almacen-firestore';
import { Viaje } from './estado';

const base: Viaje = {
  id: 'x', estado: 'solicitado', pasajero: 'p1',
  origen: { nombre: 'A', lngLat: [-99.1, 19.4] }, destino: { nombre: 'B', lngLat: [-99.2, 19.5] }, costo: 50,
  rutaRecogida: [[-99.1, 19.4], [-99.11, 19.41]], rutaViaje: [[-99.11, 19.41], [-99.2, 19.5]],
  historial: [{ estado: 'solicitado', en: 1, por: 'p1' }],
};

describe('aDoc / deDoc', () => {
  it('ida y vuelta da el mismo viaje, sin arreglos anidados ni id ni undefined', () => {
    const d = aDoc({ ...base, conductor: undefined });
    expect(d['rutaViaje']).toEqual([{ lng: -99.11, lat: 19.41 }, { lng: -99.2, lat: 19.5 }]);
    expect('id' in d).toBe(false);
    expect('conductor' in d).toBe(false);
    expect(deDoc('x', d)).toEqual(base);
  });

  it('conserva conductor y posicion', () => {
    const v: Viaje = { ...base, estado: 'en_camino', conductor: 'c1', posicion: [-99.1, 19.4] };
    expect(deDoc('x', aDoc(v))).toEqual(v);
  });
});
