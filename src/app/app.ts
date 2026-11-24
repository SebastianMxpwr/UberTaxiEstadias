import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  imports: [IonApp, IonRouterOutlet],
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet /></ion-app>',
})
export class App {}
