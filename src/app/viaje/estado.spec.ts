import { describe, it, expect } from 'vitest';
import { Estado, Quien, Viaje, puedeIr, transicion } from './estado';

const pas: Quien = { rol: 'pasajero', id: 'pasajero-1' };
const con1: Quien = { rol: 'conductor', id: 'conductor-1' };
const con2: Quien = { rol: 'conductor', id: 'conductor-2' };

const base = (): Viaje => ({
  id: 'v1', estado: 'solicitado', pasajero: pas.id,
  origen: { nombre: 'A', lngLat: [0, 0] }, destino: { nombre: 'B', lngLat: [1, 1] }, costo: 100,
  rutaRecogida: [[5, 5], [6, 6]], rutaViaje: [[0, 0], [1, 1]], historial: [],
});
const en = (estado: Estado): Viaje => ({ ...base(), estado, conductor: estado === 'solicitado' ? undefined : con1.id });

describe('estado del viaje', () => {
  it('camino feliz completo con historial y posición inicial', () => {
    let v = transicion(base(), 'aceptado', con1, 1);
    expect(v.conductor).toBe(con1.id);
    v = transicion(v, 'en_camino', con1, 2);
    expect(v.posicion).toEqual([5, 5]);
    v = transicion(v, 'en_curso', con1, 3);
    v = transicion(v, 'terminado', con1, 4);
    expect(v.estado).toBe('terminado');
    expect(v.historial.map((h) => h.estado)).toEqual(['aceptado', 'en_camino', 'en_curso', 'terminado']);
  });

  it('no muta el viaje original', () => {
    const v = base();
    transicion(v, 'aceptado', con1);
    expect(v.estado).toBe('solicitado');
    expect(v.historial).toHaveLength(0);
  });

  it('rechaza saltos inválidos', () => {
    expect(() => transicion(base(), 'en_curso', con1)).toThrow();
    expect(() => transicion(en('aceptado'), 'en_curso', con1)).toThrow();
    expect(() => transicion(en('aceptado'), 'terminado', con1)).toThrow();
    expect(() => transicion(en('en_camino'), 'terminado', con1)).toThrow();
  });

  it('cancelar: desde solicitado, aceptado y en_camino; no desde en_curso ni finales', () => {
    expect(puedeIr(en('solicitado'), 'cancelado', pas)).toBe(true);
    expect(puedeIr(en('aceptado'), 'cancelado', pas)).toBe(true);
    expect(puedeIr(en('en_camino'), 'cancelado', pas)).toBe(true);
    expect(puedeIr(en('aceptado'), 'cancelado', con1)).toBe(true);
    expect(puedeIr(en('en_camino'), 'cancelado', con1)).toBe(true);
    for (const e of ['en_curso', 'terminado', 'cancelado'] as Estado[]) {
      expect(puedeIr(en(e), 'cancelado', pas)).toBe(false);
      expect(puedeIr(en(e), 'cancelado', con1)).toBe(false);
    }
  });

  it('en solicitado solo cancela el pasajero dueño', () => {
    expect(puedeIr(en('solicitado'), 'cancelado', con1)).toBe(false);
    expect(puedeIr(en('solicitado'), 'cancelado', { rol: 'pasajero', id: 'otro' })).toBe(false);
  });

  it('un segundo conductor no puede aceptar', () => {
    const v = transicion(base(), 'aceptado', con1);
    expect(() => transicion(v, 'aceptado', con2)).toThrow('Este viaje ya lo tomó otro conductor');
  });

  it('aceptar un viaje cancelado dice que el pasajero lo canceló', () => {
    const v = transicion(base(), 'cancelado', pas);
    expect(() => transicion(v, 'aceptado', con1)).toThrow('El pasajero canceló este viaje');
  });

  it('otro conductor no puede avanzar un viaje ajeno', () => {
    expect(puedeIr(en('aceptado'), 'en_camino', con2)).toBe(false);
    expect(puedeIr(en('aceptado'), 'cancelado', con2)).toBe(false);
  });

  it('el pasajero no puede aceptar ni avanzar', () => {
    expect(puedeIr(base(), 'aceptado', pas)).toBe(false);
    expect(puedeIr(en('aceptado'), 'en_camino', pas)).toBe(false);
  });
});
