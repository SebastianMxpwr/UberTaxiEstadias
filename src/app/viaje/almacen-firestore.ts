import { FirebaseError, initializeApp } from 'firebase/app';
import {
  addDoc, collection, connectFirestoreEmulator, doc, getDoc, getFirestore, onSnapshot, query, runTransaction, updateDoc, where,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { AlmacenViajes } from './almacen';
import { Estado, LngLat, Quien, Viaje, transicion } from './estado';

type Doc = Record<string, unknown>;
type Pt = { lng: number; lat: number };

/** Firestore no admite arreglos anidados: las rutas se guardan como [{lng, lat}]. */
export function aDoc(v: Omit<Viaje, 'id'>): Doc {
  const { rutaRecogida, rutaViaje, ...resto } = v as Viaje;
  delete (resto as Partial<Viaje>).id;
  const pt = ([lng, lat]: LngLat): Pt => ({ lng, lat });
  return Object.fromEntries(
    Object.entries({ ...resto, rutaRecogida: rutaRecogida.map(pt), rutaViaje: rutaViaje.map(pt) }).filter(([, x]) => x !== undefined),
  );
}

export function deDoc(id: string, d: Doc): Viaje {
  const pt = (p: Pt): LngLat => [p.lng, p.lat];
  const x = d as unknown as { rutaRecogida: Pt[]; rutaViaje: Pt[] };
  return { ...d, id, rutaRecogida: x.rutaRecogida.map(pt), rutaViaje: x.rutaViaje.map(pt) } as unknown as Viaje;
}

export class AlmacenFirestore implements AlmacenViajes {
  private readonly db;
  private readonly trips;

  constructor() {
    const app = initializeApp({ apiKey: 'demo', projectId: environment.projectId }, 'traslados');
    this.db = getFirestore(app);
    connectFirestoreEmulator(this.db, environment.emulador!.host, environment.emulador!.puerto);
    this.trips = collection(this.db, 'trips');
  }

  async crear(v: Omit<Viaje, 'id'>): Promise<string> {
    return (await addDoc(this.trips, aDoc(v))).id;
  }

  observar(id: string, cb: (v: Viaje | undefined) => void): () => void {
    return onSnapshot(doc(this.trips, id), (s) => cb(s.exists() ? deDoc(s.id, s.data()) : undefined));
  }

  observarSolicitados(cb: (vs: Viaje[]) => void): () => void {
    return onSnapshot(query(this.trips, where('estado', '==', 'solicitado')), (s) => cb(s.docs.map((d) => deDoc(d.id, d.data()))));
  }

  async mover(id: string, a: Estado, quien: Quien): Promise<Viaje> {
    const ref = doc(this.trips, id);
    try {
      return await runTransaction(this.db, async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists()) throw new Error('El viaje no existe');
        const nuevo = transicion(deDoc(id, s.data()), a, quien);
        tx.set(ref, aDoc(nuevo));
        return nuevo;
      });
    } catch (e) {
      // El emulador evalúa las reglas antes de detectar el choque: el perdedor de una carrera recibe
      // permission-denied. Se relee y se vuelve a validar para devolver el mensaje del dominio.
      if (e instanceof FirebaseError && e.code === 'permission-denied') {
        const s = await getDoc(ref);
        if (s.exists()) transicion(deDoc(id, s.data()), a, quien);
      }
      throw e;
    }
  }

  async posicion(id: string, p: LngLat): Promise<void> {
    try {
      await updateDoc(doc(this.trips, id), { posicion: p });
    } catch (e) {
      // las reglas la rechazan si el viaje ya no está en_camino/en_curso
      if (!(e instanceof FirebaseError && e.code === 'permission-denied')) throw e;
    }
  }
}
