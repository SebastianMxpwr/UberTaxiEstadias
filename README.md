# Traslados

Demo de viaje en vivo entre un pasajero y un conductor. Es la app del conductor de las estadías de 2021 (sigue intacta en la rama `master`), rehecha aquí como primer paso de "Traslados".

| Pasajero eligiendo (375) | Pasajero en camino (375) | Conductor en viaje (375) |
|---|---|---|
| ![](docs/capturas/pasajero-eligiendo-375.png) | ![](docs/capturas/pasajero-en-camino-375.png) | ![](docs/capturas/conductor-en-curso-375.png) |

| Inicio (1440) | Pasajero en camino (1440) |
|---|---|
| ![](docs/capturas/inicio-1440.png) | ![](docs/capturas/pasajero-en-camino-1440.png) |

| Conductor en viaje, oscuro (1440) | Pasajero en camino (1280x560) |
|---|---|
| ![](docs/capturas/conductor-en-curso-1440-oscuro.png) | ![](docs/capturas/pasajero-en-camino-1280x560.png) |

Más: `inicio-375`, `pasajero-eligiendo-1440`, `conductor-en-curso-1440` y `pasajero-en-camino-1440-oscuro` en `docs/capturas/`.

## Antes (`master`) y después (rama `traslados`)

| | Antes (2021) | Después |
|---|---|---|
| Stack | Angular 12, Ionic 5, Cordova 9, AngularFire 6 / Firebase 8 | Angular 22, Ionic 9, Capacitor 8 (solo `capacitor.config.ts`), Vitest, Playwright |
| Mapa | Google Maps con la llave en el repo | MapLibre GL + OpenFreeMap, sin llaves |
| Aceptar un viaje | Escritura directa: dos conductores podían tomar el mismo viaje | Transición validada y transaccional (`navigator.locks`): uno gana, el otro recibe "Este viaje ya lo tomó otro conductor" |
| Si falla la ruta | El viaje se perdía | Las rutas viajan dentro del viaje y se precalculan (OSRM) |
| Estados | Sin máquina de estados explícita | Máquina de estados pura y probada (`estado.ts`) |
| Pruebas | Solo las pruebas de plantilla (Karma / Protractor) | 18 pruebas Vitest, 12 de reglas de Firestore y 2 e2e de dos pestañas (en memoria y en el emulador) |

## Cómo correrla

```
npm install
npm start
```

Abre `http://localhost:4200/pasajero` y `http://localhost:4200/conductor` en **dos pestañas del mismo navegador**, o en `/pasajero` activa el interruptor "Conductor simulado". Con `?vel=N` cada tramo (20 s) dura N veces menos.

## Pruebas

- `npm test`: Vitest, una sola corrida (máquina de estados, rutas y almacén).
- `npm run e2e`: Playwright con el Chrome instalado (`channel: 'chrome'`; no hace falta `playwright install`). Levanta `ng serve --port 4310` y prueba, con dos o tres páginas en un mismo contexto, el viaje completo y la carrera de dos conductores aceptando a la vez.
- `npm run test:reglas` y `npm run e2e:firestore`: ver "Modo Firestore (emulador)".
- `node e2e/capturas.mjs` (con `ng serve --port 4310` corriendo) regenera las capturas de `docs/capturas/`.

## Arquitectura

- `src/app/viaje/estado.ts`: dominio puro (estados, `puedeIr`, `transicion`), sin Angular.
- `AlmacenViajes` es una interfaz; hay dos adaptadores: `AlmacenMemoria` (localStorage + BroadcastChannel + `storage` + `navigator.locks`, el de por defecto) y `AlmacenFirestore` (colección `trips`, transacciones de Firestore; se elige por `environment`).
- Mapa con MapLibre GL y el estilo de OpenFreeMap; el worker de maplibre se copia a assets (ver `angular.json`).
- Rutas OSRM precalculadas en `src/app/viaje/rutas-semilla.json` (`node scripts/generar-rutas.mjs` las regenera); la app nunca llama a OSRM.
- Capacitor configurado, sin plataformas android/ios todavía.

## Modo Firestore (emulador)

Mismo código, otro almacén: `AlmacenFirestore` contra el emulador local, con el proyecto `demo-traslados` (el prefijo `demo-` impide tocar un proyecto real). No hay llaves ni cuentas.

- Requisitos: Java 21 (el jar del emulador se descarga solo la primera vez).
- `npm run emuladores` y, en otra terminal, `npm run start:firestore` (`http://localhost:4200`).
- `npm run test:reglas`: levanta el emulador y prueba `firestore.rules` (camino feliz, saltos de estado, costo, conductor, posición, borrado).
- `npm run e2e:firestore`: las mismas 2 pruebas e2e contra Firestore (puerto 4311); la carrera de dos conductores se resuelve con `runTransaction`.

## Límites conocidos

- Las reglas de Firestore no verifican identidad todavía (falta Auth): validan que la transición sea legal, no quién la hace; eso lo valida el dominio en el cliente.

- El estado vive en localStorage y crece con cada viaje; no se limpia.
- Recargar la pestaña del conductor reinicia el tramo en curso desde su inicio.
- El conductor simulado solo atiende el viaje de su propia pestaña.
- localStorage es el almacén de una demo en un solo navegador: no sustituye a un servidor.

## Pendiente

- Siguiente rebanada: Auth anónima y reglas que comparen con `request.auth.uid`.
- Fuera de alcance: push, invitaciones, cuentas y pagos.
