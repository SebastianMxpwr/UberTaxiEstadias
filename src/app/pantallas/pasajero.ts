import { Component, effect, inject, signal, computed, DestroyRef } from '@angular/core';
import { IonButton, IonChip, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToggle, IonToolbar, ToastController } from '@ionic/angular';
import { MapaViajeComponent } from '../mapa/mapa-viaje.component';
import { ALMACEN } from '../viaje/almacen';
import { Estado, Quien, Viaje, puedeIr } from '../viaje/estado';
import { MotorConductor, identidad, velocidad } from '../viaje/movimiento';
import { SEMILLAS, TEXTO_PASAJERO } from '../viaje/textos';

const SIMULADO: Quien = { rol: 'conductor', id: 'conductor-simulado' };
const CLAVE_VIAJE = 'traslados:viaje:pasajero';

@Component({
  selector: 'app-pasajero',
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonChip, IonList, IonItem, IonLabel, IonToggle, MapaViajeComponent],
  template: `
    <ion-header><ion-toolbar><ion-title>Pasajero</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      @if (viaje(); as v) {
        <app-mapa-viaje [viaje]="v" />
        <ion-chip data-testid="estado" aria-live="polite">{{ textos[v.estado] }}</ion-chip>
        <p>{{ v.origen.nombre }} → {{ v.destino.nombre }} · $ {{ v.costo }} MXN</p>
        @if (puedeCancelar()) {
          <ion-button data-testid="cancelar" color="danger" fill="outline" (click)="cancelar(v)">Cancelar</ion-button>
        }
        @if (v.estado === 'terminado' || v.estado === 'cancelado') {
          <ion-button data-testid="otro" (click)="otro()">Pedir otro viaje</ion-button>
        }
      } @else {
        <ion-list>
          @for (s of semillas; track s.nombre; let i = $index) {
            <ion-item button detail="false" [color]="elegido() === i ? 'primary' : undefined" (click)="elegido.set(i)">
              <ion-label>{{ s.nombre }}<p>$ {{ s.costo }} MXN</p></ion-label>
            </ion-item>
          }
        </ion-list>
        <ion-button data-testid="pedir" expand="block" (click)="pedir()">Pedir viaje</ion-button>
      }
      <ion-toggle data-testid="simulado" [checked]="simulado()" (ionChange)="simulado.set($event.detail.checked)">Conductor simulado</ion-toggle>
    </ion-content>
  `,
})
export class Pasajero {
  private readonly almacen = inject(ALMACEN);
  private readonly toast = inject(ToastController);
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
      (await this.toast.create({ message: (e as Error).message, duration: 3000, color: 'danger' })).present();
    }
  }

  protected otro(): void {
    sessionStorage.removeItem(CLAVE_VIAJE);
    this.viajeId.set(undefined);
  }
}
