import { beforeEach, describe, expect, it } from 'vitest';
import { AlmacenMemoria } from './almacen-memoria';
import { Quien, Viaje } from './estado';

const pas: Quien = { rol: 'pasajero', id: 'pasajero-1' };
const con1: Quien = { rol: 'conductor', id: 'conductor-1' };
const con2: Quien = { rol: 'conductor', id: 'conductor-2' };

const nuevo = (): Omit<Viaje, 'id'> => ({
  estado: 'solicitado', pasajero: pas.id,
  origen: { nombre: 'A', lngLat: [0, 0] }, destino: { nombre: 'B', lngLat: [1, 1] }, costo: 100,
  rutaRecogida: [[5, 5], [6, 6]], rutaViaje: [[0, 0], [1, 1]], historial: [],
});

describe('AlmacenMemoria', () => {
  beforeEach(() => localStorage.clear());

  it('crear -> observar -> mover: el callback recibe el nuevo estado', async () => {
    const a = new AlmacenMemoria();
    const id = await a.crear(nuevo());
    const vistos: (string | undefined)[] = [];
    const baja = a.observar(id, (v) => vistos.push(v?.estado));
    await a.mover(id, 'aceptado', con1);
    expect(vistos).toEqual(['solicitado', 'aceptado']);
    baja();
    await a.mover(id, 'en_camino', con1);
    expect(vistos).toHaveLength(2);
  });

  it('observarSolicitados solo lista los solicitados', async () => {
    const a = new AlmacenMemoria();
    const id1 = await a.crear(nuevo());
    await a.crear(nuevo());
    let lista: Viaje[] = [];
    a.observarSolicitados((vs) => (lista = vs));
    expect(lista).toHaveLength(2);
    await a.mover(id1, 'aceptado', con1);
    expect(lista).toHaveLength(1);
  });

  it('dos conductores aceptan a la vez: uno gana y el otro es rechazado', async () => {
    const a = new AlmacenMemoria();
    const id = await a.crear(nuevo());
    const r = await Promise.allSettled([a.mover(id, 'aceptado', con1), a.mover(id, 'aceptado', con2)]);
    expect(r.map((x) => x.status)).toEqual(['fulfilled', 'rejected']);
    expect((r[1] as PromiseRejectedResult).reason.message).toBe('Este viaje ya lo tomó otro conductor');
  });

  it('posicion solo se guarda en en_camino o en_curso', async () => {
    const a = new AlmacenMemoria();
    const id = await a.crear(nuevo());
    let v: Viaje | undefined;
    a.observar(id, (x) => (v = x));
    await a.posicion(id, [9, 9]);
    expect(v?.posicion).toBeUndefined();
    await a.mover(id, 'aceptado', con1);
    await a.mover(id, 'en_camino', con1);
    await a.posicion(id, [9, 9]);
    expect(v?.posicion).toEqual([9, 9]);
  });
});
