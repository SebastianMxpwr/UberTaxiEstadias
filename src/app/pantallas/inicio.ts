import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

@Component({
  selector: 'app-inicio',
  imports: [IonContent, IonButton, RouterLink],
  template: `
    <ion-content class="ion-padding ion-text-center">
      <img src="taxi.png" alt="Taxi" width="200" />
      <h1>Traslados — demo de viaje en vivo</h1>
      <ion-button expand="block" routerLink="/pasajero" queryParamsHandling="preserve">Soy pasajero</ion-button>
      <ion-button expand="block" color="dark" routerLink="/conductor" queryParamsHandling="preserve">Soy conductor</ion-button>
      <p>Ábrelas en dos pestañas del mismo navegador.</p>
    </ion-content>
  `,
})
export class Inicio {}
