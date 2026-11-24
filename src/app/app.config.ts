import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { routes } from './app.routes';
import { ALMACEN } from './viaje/almacen';
import { environment } from '../environments/environment';
import { AlmacenFirestore } from './viaje/almacen-firestore';
import { AlmacenMemoria } from './viaje/almacen-memoria';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideIonicAngular(),
    { provide: ALMACEN, useFactory: () => (environment.almacen === 'firestore' ? new AlmacenFirestore() : new AlmacenMemoria()) },
  ],
};
