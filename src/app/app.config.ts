import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { routes } from './app.routes';
import { ALMACEN } from './viaje/almacen';
import { AlmacenMemoria } from './viaje/almacen-memoria';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideIonicAngular(),
    { provide: ALMACEN, useClass: AlmacenMemoria },
  ],
};
