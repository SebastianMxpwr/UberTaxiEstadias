import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BotonTema } from '../barra';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, BotonTema],
  template: `
    <div class="inicio">
      <app-boton-tema class="inicio-tema" />
      <main class="tarjeta inicio-tarjeta">
        <img src="taxi.png" alt="Taxi" />
        <div>
          <h1>Traslados</h1>
          <p class="texto-suave">Demo de viaje en vivo</p>
        </div>
        <div class="botones">
          <a class="btn btn-primario grande" routerLink="/pasajero" queryParamsHandling="preserve"><span class="icono" aria-hidden="true">person</span>Soy pasajero</a>
          <a class="btn btn-secundario grande" routerLink="/conductor" queryParamsHandling="preserve"><span class="icono" aria-hidden="true">local_taxi</span>Soy conductor</a>
        </div>
        <p class="texto-suave">Ábrelas en dos pestañas del mismo navegador.</p>
      </main>
    </div>
  `,
})
export class Inicio {}
