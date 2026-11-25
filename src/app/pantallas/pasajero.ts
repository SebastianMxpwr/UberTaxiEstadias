import { Component, effect, inject, signal, computed, DestroyRef } from '@angular/core';
import { Aviso } from '../aviso';
import { Barra } from '../barra';
import { ResumenViaje } from '../resumen-viaje';
import { longitudKm } from '../viaje/ruta';
import { MapaViajeComponent } from '../mapa/mapa-viaje.component';
import { ALMACEN } from '../viaje/almacen';
import { Estado, Quien, Viaje, puedeIr } from '../viaje/estado';
import { MotorConductor, identidad, velocidad } from '../viaje/movimiento';
import { SEMILLAS, Semilla, TEXTO_PASAJERO } from '../viaje/textos';

const SIMULADO: Quien = { rol: 'conductor', id: 'conductor-simulado' };
const CLAVE_VIAJE = 'traslados:viaje:pasajero';

@Component({
  selector: 'app-pasajero',
  imports: [MapaViajeComponent, Barra, ResumenViaje],
  template: `
    <main class="viaje">
      <app-barra rol="Pasajero" />
      <app-mapa-viaje class="celda-mapa" [viaje]="viaje()" />
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
            <ul class="lista-viajes">
              @for (s of semillas; track s.nombre; let i = $index) {
                <li>
                  <button type="button" class="opcion" [attr.aria-pressed]="elegido() === i" (click)="elegido.set(i)">
                    <ul class="lugares">
                      <li><span class="icono" aria-hidden="true">trip_origin</span>{{ s.origen.nombre }}</li>
                      <li><span class="icono" aria-hidden="true">location_on</span>{{ s.destino.nombre }}</li>
                    </ul>
                    <span class="datos-viaje">
                      <span class="texto-suave">{{ km(s) }} km</span>
                      <span class="costo">$ {{ s.costo }}</span>
                    </span>
                  </button>
                </li>
              }
            </ul>
          </div>
          <button type="button" class="btn btn-primario grande" data-testid="pedir" (click)="pedir()">Pedir viaje</button>
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
  private readonly quien = identidad('pasajero');
  private readonly motor = new MotorConductor(this.almacen, SIMULADO);
  private ultimaClave = '';

  protected readonly textos = TEXTO_PASAJERO;
  protected readonly semillas = SEMILLAS;
  protected readonly elegido = signal(0);
  protected readonly simulado = signal(false);
  private readonly viajeId = signal<string | undefined>(sessionStorage.getItem(CLAVE_VIAJE) ?? undefined);
  protected readonly viaje = signal<Viaje | undefined>(undefined);
  protected readonly puedeCancelar = computed(() => { const v = this.viaje(); return !!v && puedeIr(v, 'cancelado', this.quien); });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.motor.destruir());
    effect((limpiar) => {
      const id = this.viajeId();
      if (!id) return this.viaje.set(undefined);
      limpiar(this.almacen.observar(id, (v) => this.viaje.set(v)));
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

  protected km(s: Semilla): string {
    return longitudKm(s.rutaViaje).toFixed(1);
  }

  protected async pedir(): Promise<void> {
    const s = SEMILLAS[this.elegido()];
    const id = await this.almacen.crear({
      estado: 'solicitado', pasajero: this.quien.id, origen: s.origen, destino: s.destino, costo: s.costo,
      rutaRecogida: s.rutaRecogida, rutaViaje: s.rutaViaje,
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
  }
}
