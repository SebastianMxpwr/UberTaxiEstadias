import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { IonButton, IonChip, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar, ToastController } from '@ionic/angular';
import { MapaViajeComponent } from '../mapa/mapa-viaje.component';
import { ALMACEN } from '../viaje/almacen';
import { Estado, Viaje, puedeIr } from '../viaje/estado';
import { MotorConductor, identidad } from '../viaje/movimiento';
import { longitudKm } from '../viaje/ruta';
import { TEXTO_CONDUCTOR } from '../viaje/textos';

const CLAVE_VIAJE = 'traslados:viaje:conductor';

@Component({
  selector: 'app-conductor',
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonChip, IonList, IonItem, IonLabel, MapaViajeComponent],
  template: `
    <ion-header><ion-toolbar><ion-title>Conductor</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      @if (viaje(); as v) {
        <app-mapa-viaje [viaje]="v" />
        <ion-chip data-testid="estado" aria-live="polite">{{ textos[v.estado] }}</ion-chip>
        <p>{{ v.origen.nombre }} → {{ v.destino.nombre }} · $ {{ v.costo }} MXN</p>
        @if (accion(); as a) {
          <ion-button data-testid="accion" expand="block" (click)="ir(v, a.a)">{{ a.texto }}</ion-button>
        } @else if (v.estado === 'en_camino' || v.estado === 'en_curso') {
          <p>Conduciendo…</p>
        }
        @if (puedeCancelar()) {
          <ion-button data-testid="cancelar" color="danger" fill="outline" (click)="ir(v, 'cancelado')">Cancelar</ion-button>
        }
        @if (v.estado === 'terminado' || v.estado === 'cancelado') {
          <ion-button data-testid="otro" (click)="otro()">Buscar otro viaje</ion-button>
        }
      } @else {
        <ion-list>
          @for (s of solicitados(); track s.id) {
            <ion-item>
              <ion-label>{{ s.origen.nombre }} → {{ s.destino.nombre }}<p>$ {{ s.costo }} MXN · {{ km(s) }} km</p></ion-label>
              <ion-button slot="end" [attr.data-testid]="'aceptar-' + s.id" (click)="aceptar(s)">Aceptar</ion-button>
            </ion-item>
          } @empty {
            <ion-item><ion-label>Sin viajes por ahora</ion-label></ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
})
export class Conductor {
  private readonly almacen = inject(ALMACEN);
  private readonly toast = inject(ToastController);
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
      (await this.toast.create({ message: (e as Error).message, duration: 3000, color: 'danger' })).present();
      return false;
    }
  }

  protected otro(): void {
    sessionStorage.removeItem(CLAVE_VIAJE);
    this.viajeId.set(undefined);
  }
}
