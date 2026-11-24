import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { aDoc } from '../src/app/viaje/almacen-firestore';
import { Estado, Quien, Viaje, transicion } from '../src/app/viaje/estado';

const pas: Quien = { rol: 'pasajero', id: 'p1' };
const con: Quien = { rol: 'conductor', id: 'c1' };
const nuevo = (): Viaje => ({
  id: 't1', estado: 'solicitado', pasajero: 'p1',
  origen: { nombre: 'A', lngLat: [-99.1, 19.4] }, destino: { nombre: 'B', lngLat: [-99.2, 19.5] }, costo: 50,
  rutaRecogida: [[-99.1, 19.4], [-99.11, 19.41]], rutaViaje: [[-99.11, 19.41], [-99.2, 19.5]],
  historial: [{ estado: 'solicitado', en: 1, por: 'p1' }],
});
/** Viaje ya avanzado hasta `hasta`, por el camino feliz del dominio. */
function en(hasta: Estado): Viaje {
  let v = nuevo();
  for (const a of ['aceptado', 'en_camino', 'en_curso', 'terminado'] as Estado[]) {
    if (v.estado === hasta) break;
    v = transicion(v, a, con);
  }
  return v;
}

let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-traslados', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const ref = () => doc(env.unauthenticatedContext().firestore(), 'trips/t1');
const sembrar = (v: Viaje) => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'trips/t1'), aDoc(v)));
/** Escribe como lo hace AlmacenFirestore.mover: documento completo. */
const escribir = (v: Viaje) => setDoc(ref(), aDoc(v));

describe('crear', () => {
  it('un viaje solicitado válido pasa', () => assertSucceeds(escribir(nuevo())));
  it('uno que nace aceptado falla', () => assertFails(escribir({ ...en('aceptado') })));
});

describe('transiciones', () => {
  it('camino feliz completo, paso a paso', async () => {
    await sembrar(nuevo());
    let v = nuevo();
    for (const a of ['aceptado', 'en_camino', 'en_curso', 'terminado'] as Estado[]) {
      v = transicion(v, a, con);
      await assertSucceeds(escribir(v));
    }
  });

  it('saltar solicitado -> en_curso falla', async () => {
    await sembrar(nuevo());
    await assertFails(escribir({ ...nuevo(), estado: 'en_curso', historial: [...nuevo().historial, { estado: 'en_curso', en: 2, por: 'c1' }] }));
  });

  it('cambiar el costo falla', async () => {
    await sembrar(nuevo());
    await assertFails(escribir({ ...transicion(nuevo(), 'aceptado', con), costo: 1 }));
  });

  it('cambiar de conductor al pasar aceptado -> en_camino falla', async () => {
    await sembrar(en('aceptado'));
    await assertFails(escribir({ ...transicion(en('aceptado'), 'en_camino', con), conductor: 'otro' }));
  });

  it('cancelar desde en_curso falla', async () => {
    await sembrar(en('en_curso'));
    await assertFails(escribir({ ...en('en_curso'), estado: 'cancelado', historial: [...en('en_curso').historial, { estado: 'cancelado', en: 9, por: 'p1' }] }));
  });

  it('cancelar desde en_camino pasa', async () => {
    await sembrar(en('en_camino'));
    await assertSucceeds(escribir(transicion(en('en_camino'), 'cancelado', pas)));
  });

  it('terminado es final', async () => {
    await sembrar(en('terminado'));
    await assertFails(escribir({ ...en('terminado'), estado: 'en_curso', historial: [...en('terminado').historial, { estado: 'en_curso', en: 9, por: 'c1' }] }));
  });
});

describe('posición', () => {
  it('en en_curso pasa', async () => {
    await sembrar(en('en_curso'));
    await assertSucceeds(updateDoc(ref(), { posicion: [-99.15, 19.45] }));
  });
  it('en solicitado falla', async () => {
    await sembrar(nuevo());
    await assertFails(updateDoc(ref(), { posicion: [-99.15, 19.45] }));
  });
});

it('borrar falla', async () => {
  await sembrar(nuevo());
  await assertFails(deleteDoc(ref()));
});
