import { Component, effect, inject, signal, computed, DestroyRef, untracked } from '@angular/core';
import { Aviso } from '../aviso';
import { Barra } from '../barra';
import { ResumenViaje } from '../resumen-viaje';
import { Sonido, sonidoDeCambio } from '../sonido';
import { longitudKm } from '../viaje/ruta';
import { Borrador, MapaViajeComponent } from '../mapa/mapa-viaje.component';
import { ALMACEN } from '../viaje/almacen';
import { Estado, LngLat, Lugar, Quien, Viaje, puedeIr } from '../viaje/estado';
import { Rutas, Sugerencia, buscar, calcularRutas, nombrarPunto, tarifa } from '../viaje/lugares';
import { MotorConductor, identidad, velocidad } from '../viaje/movimiento';
import { SEMILLAS, Semilla, TEXTO_PASAJERO } from '../viaje/textos';

type Campo = 'origen' | 'destino';
const CAMPOS: { id: Campo; icono: string; texto: string }[] = [
  { id: 'origen', icono: 'trip_origin', texto: '¿Dónde te recogemos?' },
  { id: 'destino', icono: 'location_on', texto: '¿A dónde vas?' },
];
const KMH_ESTIMADO = 25; // minutos de los viajes rápidos, que no traen duración de OSRM

const SIMULADO: Quien = { rol: 'conductor', id: 'conductor-simulado' };
const CLAVE_VIAJE = 'traslados:viaje:pasajero';

@Component({
  selector: 'app-pasajero',
  imports: [MapaViajeComponent, Barra, ResumenViaje],
  template: `
    <main class="viaje">
      <app-barra rol="Pasajero" />
      <app-mapa-viaje class="celda-mapa" [viaje]="viaje()" [borrador]="borrador()" [seleccionable]="!viaje()" (toque)="tocar($event)" />
      <section class="hoja">
        @if (viaje(); as v) {
          <div class="bloque">
            <app-resumen-viaje [viaje]="v" [texto]="textos[v.estado]" />
          </div>
          @if (v.estado === 'terminado') { <p class="aviso aviso-exito">Llegaste a tu destino.</p> }
          <div class="acciones-fila">
            @if (puedeCancelar()) {
              <button type="button" class="btn btn-secundario texto-error" data-testid="cancelar" (click)="cancelar(v)">Cancelar</button>
            }
            @if (v.estado === 'terminado' || v.estado === 'cancelado') {
              <button type="button" class="btn btn-primario" data-testid="otro" (click)="otro()">Pedir otro viaje</button>
            }
          </div>
        } @else {
          <div class="bloque">
            <h2>Elige tu viaje</h2>
            <div class="selector">
              <div class="campos">
                @for (c of campos; track c.id) {
                  <div>
                    <label class="campo">
                      <span class="icono" aria-hidden="true">{{ c.icono }}</span>
                      <input type="text" role="combobox" autocomplete="off" aria-autocomplete="list"
                        [attr.data-testid]="'campo-' + c.id" [placeholder]="c.texto" [attr.aria-label]="c.texto"
                        [attr.aria-expanded]="activo() === c.id && sugerencias().length > 0" [attr.aria-controls]="'sug-' + c.id"
                        [attr.aria-activedescendant]="activo() === c.id && indice() >= 0 ? 'op-' + c.id + '-' + indice() : null"
                        [value]="escrito()[c.id]" (focus)="activo.set(c.id)" (blur)="cerrar()"
                        (input)="escribir(c.id, $any($event.target).value)" (keydown)="tecla(c.id, $event)" />
                    </label>
                    @if (activo() === c.id && sugerencias().length) {
                      <ul class="sugerencias" role="listbox" [id]="'sug-' + c.id" [attr.aria-label]="c.texto" (pointerdown)="$event.preventDefault()">
                        @for (s of sugerencias(); track $index; let i = $index) {
                          <li role="option" [id]="'op-' + c.id + '-' + i" [attr.aria-selected]="i === indice()" (click)="elegir(c.id, s)">
                            <strong>{{ s.nombre }}</strong>
                            @if (s.detalle) { <span class="texto-suave">{{ s.detalle }}</span> }
                          </li>
                        }
                      </ul>
                    }
                  </div>
                }
              </div>
              <button type="button" class="btn btn-texto mini" aria-label="Intercambiar origen y destino" (click)="intercambiar()"><span class="icono" aria-hidden="true">swap_vert</span></button>
            </div>
            @if (mensaje()) { <p class="texto-suave" aria-live="polite">{{ mensaje() }}</p> }
            <p class="texto-suave">También puedes tocar el mapa: primero el origen, luego el destino</p>
          </div>
          @if (rutas(); as r) {
            <div class="bloque">
              <div class="datos-fila texto-suave">
                <span><span class="icono" aria-hidden="true">route</span> {{ r.km.toFixed(1) }} km</span>
                <span><span class="icono" aria-hidden="true">schedule</span> {{ r.min }} min</span>
              </div>
              <p class="costo" data-testid="costo">$ {{ costo() }} <small>MXN</small></p>
            </div>
          } @else if (calculando()) {
            <p class="texto-suave" aria-live="polite">Calculando ruta…</p>
          }
          <button type="button" class="btn btn-primario grande" data-testid="pedir" [disabled]="!rutas()" (click)="pedir()">Pedir viaje</button>
          <div class="bloque">
            <h2>Viajes rápidos</h2>
            <div class="rapidos">
              @for (s of semillas; track s.nombre; let i = $index) {
                <button type="button" class="btn btn-secundario mini" [attr.data-testid]="'rapido-' + i" (click)="rapido(s)">{{ s.nombre }}</button>
              }
            </div>
          </div>
        }
        <div class="bloque fila-interruptor">
          <span id="etq-simulado">Conductor simulado</span>
          <button type="button" role="switch" class="interruptor" data-testid="simulado" aria-labelledby="etq-simulado" [attr.aria-checked]="simulado()" (click)="simulado.set(!simulado())"><span class="perilla"></span></button>
        </div>
      </section>
    </main>
  `,
})
export class Pasajero {
  private readonly almacen = inject(ALMACEN);
  private readonly aviso = inject(Aviso);
  private readonly sonido = inject(Sonido);
  private readonly quien = identidad('pasajero');
  private readonly motor = new MotorConductor(this.almacen, SIMULADO);
  private ultimaClave = '';

  protected readonly textos = TEXTO_PASAJERO;
  protected readonly semillas = SEMILLAS;
  protected readonly campos = CAMPOS;
  protected readonly puntos = signal<Partial<Record<Campo, Lugar>>>({});
  protected readonly escrito = signal<Record<Campo, string>>({ origen: '', destino: '' });
  protected readonly rutas = signal<Rutas | undefined>(undefined);
  protected readonly calculando = signal(false);
  protected readonly costo = computed(() => tarifa(this.rutas()?.km ?? 0));
  protected readonly borrador = computed<Borrador>(() => ({ ...this.puntos(), rutaViaje: this.rutas()?.rutaViaje, rutaRecogida: this.rutas()?.rutaRecogida }));
  protected readonly activo = signal<Campo | undefined>(undefined);
  protected readonly sugerencias = signal<Sugerencia[]>([]);
  protected readonly indice = signal(-1);
  protected readonly mensaje = signal('');
  private temporizador?: ReturnType<typeof setTimeout>;
  private busqueda?: AbortController;
  private calculo = 0;
  protected readonly simulado = signal(false);
  private readonly viajeId = signal<string | undefined>(sessionStorage.getItem(CLAVE_VIAJE) ?? undefined);
  protected readonly viaje = signal<Viaje | undefined>(undefined);
  protected readonly puedeCancelar = computed(() => { const v = this.viaje(); return !!v && puedeIr(v, 'cancelado', this.quien); });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.motor.destruir());
    effect((limpiar) => {
      const id = this.viajeId();
      if (!id) return this.viaje.set(undefined);
      limpiar(this.almacen.observar(id, (v) => { this.sonarCambio(v); this.viaje.set(v); }));
    });
    effect(() => {
      const v = this.viaje();
      const sim = this.simulado();
      this.motor.alCambiar(sim ? v : undefined);
      const llego = this.motor.llego(); // se lee después: alCambiar lo reinicia al cambiar de tramo
      if (!sim || !v) return void (this.ultimaClave = '');
      const siguiente: Partial<Record<Estado, Estado | undefined>> = {
        solicitado: 'aceptado', aceptado: 'en_camino',
        en_camino: llego ? 'en_curso' : undefined, en_curso: llego ? 'terminado' : undefined,
      };
      const a = siguiente[v.estado];
      const clave = `${v.id}${v.estado}${llego}`;
      if (!a || clave === this.ultimaClave) return;
      this.ultimaClave = clave;
      setTimeout(() => this.almacen.mover(v.id, a, SIMULADO).catch(() => undefined), (v.estado === 'solicitado' ? 1500 : 600) / velocidad());
    });
  }

  private sonarCambio(v?: Viaje): void {
    const s = sonidoDeCambio('pasajero', untracked(this.viaje)?.estado, v?.estado);
    if (s) this.sonido[s]();
  }

  protected escribir(c: Campo, texto: string): void {
    this.escrito.update((e) => ({ ...e, [c]: texto }));
    if (this.puntos()[c]) { // editar el texto descarta el punto elegido
      this.puntos.update((p) => ({ ...p, [c]: undefined }));
      this.invalidar();
    }
    this.cerrar();
    const t = texto.trim();
    if (t.length < 3) return;
    this.temporizador = setTimeout(async () => {
      const ctl = (this.busqueda = new AbortController());
      this.mensaje.set('Buscando…');
      try {
        const r = await buscar(t, ctl.signal);
        this.sugerencias.set(r);
        this.mensaje.set(r.length ? '' : 'Sin resultados');
      } catch {
        if (!ctl.signal.aborted) this.mensaje.set('No se pudo buscar, intenta de nuevo o toca el mapa');
      }
    }, 350);
  }

  /** Cierra la lista y cancela la búsqueda pendiente. */
  protected cerrar(): void {
    clearTimeout(this.temporizador);
    this.busqueda?.abort();
    this.sugerencias.set([]);
    this.indice.set(-1);
    this.mensaje.set('');
  }

  protected tecla(c: Campo, e: KeyboardEvent): void {
    const n = this.sugerencias().length;
    if (e.key === 'Escape') return this.cerrar();
    if (!n) return;
    if (e.key === 'ArrowDown') this.indice.set((this.indice() + 1) % n);
    else if (e.key === 'ArrowUp') this.indice.set(this.indice() <= 0 ? n - 1 : this.indice() - 1);
    else if (e.key === 'Enter') this.elegir(c, this.sugerencias()[Math.max(0, this.indice())]);
    else return;
    e.preventDefault();
  }

  protected elegir(c: Campo, s: Sugerencia): void {
    this.fijar(c, { nombre: s.nombre, lngLat: s.lngLat });
  }

  private fijar(c: Campo, lugar: Lugar): void {
    this.cerrar();
    this.puntos.update((p) => ({ ...p, [c]: lugar }));
    this.escrito.update((e) => ({ ...e, [c]: lugar.nombre }));
    void this.recalcular();
  }

  /** Toque en el mapa: origen si falta; si no, destino (reemplaza al anterior). */
  protected async tocar(p: LngLat): Promise<void> {
    const c: Campo = this.puntos().origen ? 'destino' : 'origen';
    const lugar: Lugar = { nombre: 'Buscando dirección…', lngLat: p };
    this.fijar(c, lugar);
    const nombre = await nombrarPunto(p);
    if (this.puntos()[c] !== lugar) return; // ya eligió otra cosa mientras tanto
    this.puntos.update((q) => ({ ...q, [c]: { nombre, lngLat: p } }));
    this.escrito.update((e) => ({ ...e, [c]: nombre }));
  }

  protected intercambiar(): void {
    const { origen, destino } = this.puntos();
    this.cerrar();
    this.puntos.set({ origen: destino, destino: origen });
    this.escrito.update((e) => ({ origen: e.destino, destino: e.origen }));
    void this.recalcular();
  }

  protected rapido(s: Semilla): void {
    this.cerrar();
    this.invalidar();
    this.puntos.set({ origen: s.origen, destino: s.destino });
    this.escrito.set({ origen: s.origen.nombre, destino: s.destino.nombre });
    const km = longitudKm(s.rutaViaje);
    this.rutas.set({ rutaViaje: s.rutaViaje, rutaRecogida: s.rutaRecogida, km, min: Math.max(1, Math.round((km / KMH_ESTIMADO) * 60)) });
  }

  /** Descarta rutas y cálculos en curso. */
  private invalidar(): void {
    this.calculo++;
    this.rutas.set(undefined);
    this.calculando.set(false);
  }

  private async recalcular(): Promise<void> {
    this.invalidar();
    const { origen, destino } = this.puntos();
    if (!origen || !destino) return;
    const n = this.calculo;
    this.calculando.set(true);
    try {
      const r = await calcularRutas(origen.lngLat, destino.lngLat);
      if (n === this.calculo) this.rutas.set(r);
    } catch {
      if (n === this.calculo) this.aviso.mostrar('No se pudo calcular la ruta');
    } finally {
      if (n === this.calculo) this.calculando.set(false);
    }
  }

  protected async pedir(): Promise<void> {
    const { origen, destino } = this.puntos();
    const r = this.rutas();
    if (!origen || !destino || !r) return;
    const id = await this.almacen.crear({
      estado: 'solicitado', pasajero: this.quien.id, origen, destino, costo: this.costo(),
      rutaRecogida: r.rutaRecogida, rutaViaje: r.rutaViaje,
      historial: [{ estado: 'solicitado', en: Date.now(), por: this.quien.id }],
    });
    sessionStorage.setItem(CLAVE_VIAJE, id);
    this.viajeId.set(id);
  }

  protected async cancelar(v: Viaje): Promise<void> {
    try {
      await this.almacen.mover(v.id, 'cancelado', this.quien);
    } catch (e) {
      this.aviso.mostrar((e as Error).message);
    }
  }

  protected otro(): void {
    sessionStorage.removeItem(CLAVE_VIAJE);
    this.viajeId.set(undefined);
    this.invalidar();
    this.puntos.set({});
    this.escrito.set({ origen: '', destino: '' });
  }
}
