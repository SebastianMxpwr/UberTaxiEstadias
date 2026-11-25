import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { Aviso } from '../aviso';
import { Barra } from '../barra';
import { ResumenViaje } from '../resumen-viaje';
import { MapaViajeComponent } from '../mapa/mapa-viaje.component';
import { ALMACEN } from '../viaje/almacen';
import { Estado, Viaje, puedeIr } from '../viaje/estado';
import { MotorConductor, identidad } from '../viaje/movimiento';
import { longitudKm } from '../viaje/ruta';
import { TEXTO_CONDUCTOR } from '../viaje/textos';

const CLAVE_VIAJE = 'traslados:viaje:conductor';

@Component({
  selector: 'app-conductor',
  imports: [MapaViajeComponent, Barra, ResumenViaje],
  template: `
    <main class="viaje">
      <app-barra rol="Conductor" />
      <app-mapa-viaje class="celda-mapa" [viaje]="viaje()" />
      <section class="hoja">
        @if (viaje(); as v) {
          <div class="bloque">
            <app-resumen-viaje [viaje]="v" [texto]="textos[v.estado]" />
          </div>
          @if (v.estado === 'terminado') { <p class="aviso aviso-exito">Viaje terminado.</p> }
          @if (!accion() && (v.estado === 'en_camino' || v.estado === 'en_curso')) { <p class="texto-suave">Conduciendo…</p> }
          <div class="acciones-fila">
            @if (accion(); as a) {
              <button type="button" class="btn btn-primario" data-testid="accion" (click)="ir(v, a.a)">{{ a.texto }}</button>
            }
            @if (puedeCancelar()) {
              <button type="button" class="btn btn-secundario texto-error" data-testid="cancelar" (click)="ir(v, 'cancelado')">Cancelar</button>
            }
            @if (v.estado === 'terminado' || v.estado === 'cancelado') {
              <button type="button" class="btn btn-primario" data-testid="otro" (click)="otro()">Buscar otro viaje</button>
            }
          </div>
        } @else {
          <div class="bloque">
            <div class="titulo-panel">
              <h2>Viajes disponibles</h2>
              <span class="etiqueta">{{ solicitados().length }}</span>
            </div>
            @if (solicitados().length) {
              <ul class="lista-viajes">
                @for (s of solicitados(); track s.id) {
                  <li class="oferta">
                    <ul class="lugares">
                      <li><span class="icono" aria-hidden="true">trip_origin</span>{{ s.origen.nombre }}</li>
                      <li><span class="icono" aria-hidden="true">location_on</span>{{ s.destino.nombre }}</li>
                    </ul>
                    <span class="datos-viaje">
                      <span class="texto-suave">{{ km(s) }} km</span>
                      <span class="costo">$ {{ s.costo }}</span>
                    </span>
                    <button type="button" class="btn btn-primario" [attr.data-testid]="'aceptar-' + s.id" (click)="aceptar(s)">Aceptar</button>
                  </li>
                }
              </ul>
            } @else {
              <div class="vacio">
                <span class="icono" aria-hidden="true">hourglass_empty</span>
                <p>Esperando solicitudes…</p>
              </div>
            }
          </div>
        }
      </section>
    </main>
  `,
})
export class Conductor {
  private readonly almacen = inject(ALMACEN);
  private readonly aviso = inject(Aviso);
  private readonly quien = identidad('conductor');
  private readonly motor = new MotorConductor(this.almacen, this.quien);

  protected readonly textos = TEXTO_CONDUCTOR;
  protected readonly solicitados = signal<Viaje[]>([]);
  private readonly viajeId = signal<string | undefined>(sessionStorage.getItem(CLAVE_VIAJE) ?? undefined);
  protected readonly viaje = signal<Viaje | undefined>(undefined);
  protected readonly puedeCancelar = computed(() => { const v = this.viaje(); return !!v && puedeIr(v, 'cancelado', this.quien); });
  protected readonly accion = computed<{ texto: string; a: Estado } | undefined>(() => {
    const v = this.viaje();
    const llego = this.motor.llego();
    if (v?.estado === 'aceptado') return { texto: 'Ir a recoger', a: 'en_camino' };
    if (v?.estado === 'en_camino' && llego) return { texto: 'Iniciar viaje', a: 'en_curso' };
    if (v?.estado === 'en_curso' && llego) return { texto: 'Terminar', a: 'terminado' };
    return undefined;
  });

  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(() => this.motor.destruir());
    destroy.onDestroy(this.almacen.observarSolicitados((vs) => this.solicitados.set(vs)));
    effect((limpiar) => {
      const id = this.viajeId();
      if (!id) return this.viaje.set(undefined);
      limpiar(this.almacen.observar(id, (v) => { this.viaje.set(v); this.motor.alCambiar(v); }));
    });
  }

  protected km(v: Viaje): string {
    return longitudKm(v.rutaViaje).toFixed(1);
  }

  protected async aceptar(v: Viaje): Promise<void> {
    if (await this.ir(v, 'aceptado')) {
      sessionStorage.setItem(CLAVE_VIAJE, v.id);
      this.viajeId.set(v.id);
    }
  }

  protected async ir(v: Viaje, a: Estado): Promise<boolean> {
    try {
      await this.almacen.mover(v.id, a, this.quien);
      return true;
    } catch (e) {
      this.aviso.mostrar((e as Error).message);
      return false;
    }
  }

  protected otro(): void {
    sessionStorage.removeItem(CLAVE_VIAJE);
    this.viajeId.set(undefined);
  }
}
