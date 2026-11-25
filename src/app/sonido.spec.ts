import { describe, it, expect } from 'vitest';
import { hayNuevo, sonidoDeCambio } from './sonido';

describe('sonidoDeCambio', () => {
  it('la primera lectura y los estados repetidos no suenan', () => {
    expect(sonidoDeCambio('pasajero', undefined, 'aceptado')).toBeUndefined();
    expect(sonidoDeCambio('pasajero', 'en_curso', 'en_curso')).toBeUndefined();
  });
  it('pasajero: aceptado y en_curso inician, terminado cierra', () => {
    expect(sonidoDeCambio('pasajero', 'solicitado', 'aceptado')).toBe('inicio');
    expect(sonidoDeCambio('pasajero', 'en_camino', 'en_curso')).toBe('inicio');
    expect(sonidoDeCambio('pasajero', 'en_curso', 'terminado')).toBe('fin');
  });
  it('conductor: aceptado no suena (lo acaba de tocar)', () => {
    expect(sonidoDeCambio('conductor', 'solicitado', 'aceptado')).toBeUndefined();
    expect(sonidoDeCambio('conductor', 'en_camino', 'en_curso')).toBe('inicio');
  });
  it('cancelar no suena', () => {
    expect(sonidoDeCambio('pasajero', 'aceptado', 'cancelado')).toBeUndefined();
  });
});

describe('hayNuevo', () => {
  it('la carga inicial no cuenta', () => expect(hayNuevo(undefined, ['a'])).toBe(false));
  it('un id que no estaba sí', () => expect(hayNuevo(['a'], ['a', 'b'])).toBe(true));
  it('que desaparezca uno no', () => expect(hayNuevo(['a', 'b'], ['a'])).toBe(false));
});
