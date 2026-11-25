import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { Aviso } from './aviso';

@Component({
  imports: [IonApp, IonRouterOutlet],
  selector: 'app-root',
  template: `
    <ion-app><ion-router-outlet /></ion-app>
    @if (aviso.texto(); as t) { <p class="toast aviso aviso-error" role="alert">{{ t }}</p> }
  `,
})
export class App {
  protected readonly aviso = inject(Aviso);
}
