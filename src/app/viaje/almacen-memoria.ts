import { Injectable } from '@angular/core';
import { AlmacenViajes } from './almacen';
import { Estado, LngLat, Quien, Viaje, transicion } from './estado';

const CLAVE = 'traslados:viajes';

// shortcut: sin navigator.locks (jsdom, navegadores viejos) el candado es una cola en memoria
// que solo protege dentro de una pestaña; en la demo real siempre existe navigator.locks.
let cola: Promise<unknown> = Promise.resolve();
function candado<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('traslados', fn);
  const r = cola.then(fn);
  cola = r.catch(() => undefined);
  return r;
}

/** Demo sin servidor: estado en localStorage, aviso entre pestañas con BroadcastChannel. */
@Injectable()
export class AlmacenMemoria implements AlmacenViajes {
  private readonly oyentes = new Set<() => void>();
  private readonly canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('traslados') : undefined;

  constructor() {
    if (this.canal) this.canal.onmessage = () => this.oyentes.forEach((f) => f());
    // BroadcastChannel puede llegar antes de que localStorage sea visible en esta pestaña;
    // el evento `storage` solo se dispara cuando el valor ya se puede leer.
    if (typeof addEventListener === 'function') addEventListener('storage', (e) => e.key === CLAVE && this.oyentes.forEach((f) => f()));
  }

  private leer(): Record<string, Viaje> {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
    } catch {
      return {};
    }
  }

  private guardar(todos: Record<string, Viaje>): void {
    localStorage.setItem(CLAVE, JSON.stringify(todos));
    this.oyentes.forEach((f) => f());
    this.canal?.postMessage('cambio');
  }

  crear(v: Omit<Viaje, 'id'>): Promise<string> {
    return candado(async () => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      this.guardar({ ...this.leer(), [id]: { ...v, id } });
      return id;
    });
  }

  observar(id: string, cb: (v: Viaje | undefined) => void): () => void {
    return this.suscribir(() => cb(this.leer()[id]));
  }

  observarSolicitados(cb: (vs: Viaje[]) => void): () => void {
    return this.suscribir(() => cb(Object.values(this.leer()).filter((v) => v.estado === 'solicitado')));
  }

  private suscribir(f: () => void): () => void {
    this.oyentes.add(f);
    f();
    return () => this.oyentes.delete(f);
  }

  mover(id: string, a: Estado, quien: Quien): Promise<Viaje> {
    return candado(async () => {
      const todos = this.leer();
      const v = todos[id];
      if (!v) throw new Error('El viaje no existe');
      const nuevo = transicion(v, a, quien);
      this.guardar({ ...todos, [id]: nuevo });
      return nuevo;
    });
  }

  posicion(id: string, p: LngLat): Promise<void> {
    return candado(async () => {
      const todos = this.leer();
      const v = todos[id];
      if (v && (v.estado === 'en_camino' || v.estado === 'en_curso')) this.guardar({ ...todos, [id]: { ...v, posicion: p } });
    });
  }
}
