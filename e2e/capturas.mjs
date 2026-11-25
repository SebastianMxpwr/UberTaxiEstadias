// Saca las capturas del README. Necesita `npx ng serve --port 4310` corriendo.
// Uso: node e2e/capturas.mjs
import { chromium } from '@playwright/test';

const base = 'http://localhost:4310';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });

// Photon y OSRM con respuestas fijas: las capturas no dependen de la red (el mapa sí baja sus teselas).
const lugar = (nombre, detalle, lng, lat) => ({ geometry: { coordinates: [lng, lat] }, properties: { name: nombre, district: detalle } });
async function simular(ctx) {
  await ctx.route('https://photon.komoot.io/api/**', (r) => r.fulfill({ json: { features: [
    lugar('Zócalo', 'Centro', -99.1332, 19.4326), lugar('Zócalo Sur', 'Centro', -99.1337, 19.4311),
    lugar('Zócalo Tenochtitlan', 'Centro', -99.1329, 19.4333), lugar('Estación Zócalo', 'Centro', -99.1325, 19.4349),
  ] } }));
  await ctx.route('https://photon.komoot.io/reverse**', (r) => r.fulfill({ json: { features: [lugar('Avenida Paseo de la Reforma 222', 'Juárez', 0, 0)].map((f) => ({ ...f, geometry: { coordinates: [-99.16, 19.43] } })) } }));
  // Línea quebrada entre los dos puntos de la URL (a;b), con una curva para que parezca una ruta.
  await ctx.route('https://router.project-osrm.org/**', (r) => {
    const [a, b] = decodeURIComponent(r.request().url()).split('/driving/')[1].split('?')[0].split(';').map((p) => p.split(',').map(Number));
    const pasos = Array.from({ length: 9 }, (_, i) => { const t = i / 8, c = Math.sin(t * Math.PI) * 0.0025; return [a[0] + (b[0] - a[0]) * t + c, a[1] + (b[1] - a[1]) * t - c]; });
    const km = Math.hypot((b[0] - a[0]) * 105, (b[1] - a[1]) * 111) * 1.3;
    r.fulfill({ json: { code: 'Ok', routes: [{ distance: km * 1000, duration: km * 150, geometry: { coordinates: pasos } }] } });
  });
}

// [ancho, alto, tema, sufijo, qué capturar]
const corridas = [
  [375, 812, 'claro', '375', ['inicio', 'sugerencias', 'eligiendo', 'camino', 'curso']],
  [1440, 900, 'claro', '1440', ['inicio', 'eligiendo', 'camino', 'curso']],
  [1280, 560, 'claro', '1280x560', ['camino']],
  [1440, 900, 'oscuro', '1440-oscuro', ['camino', 'curso']],
];

for (const [width, height, tema, sufijo, quiero] of corridas) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await ctx.addInitScript((t) => localStorage.setItem('pv.tema', t), tema);
  await simular(ctx);
  const pas = await ctx.newPage();
  const con = await ctx.newPage();
  const foto = (p, nombre) => p.screenshot({ path: `docs/capturas/${nombre}-${sufijo}.png` });

  if (quiero.includes('inicio')) { await pas.goto(base); await dormir(800); await foto(pas, 'inicio'); }
  await pas.goto(`${base}/pasajero?vel=4`); // tramo de 5 s
  await con.goto(`${base}/conductor?vel=4`);
  const origen = pas.getByRole('combobox', { name: '¿Dónde te recogemos?' });
  if (quiero.includes('sugerencias')) {
    await origen.fill('Zóc');
    await pas.getByRole('option').first().waitFor();
    await dormir(2000); // mapa y tipografías listos
    await foto(pas, 'pasajero-sugerencias');
  }
  if (quiero.includes('eligiendo')) {
    await origen.fill('Zóc');
    await pas.getByRole('option').first().click();
    const lienzo = pas.locator('.maplibregl-canvas');
    const caja = await lienzo.boundingBox();
    await pas.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 3);
    await pas.mouse.wheel(0, 700); // aleja el mapa para que el destino quede a varios km
    await dormir(1500);
    const [fx, fy] = width < 900 ? [0.72, 0.2] : [0.72, 0.3]; // zona libre del mapa, fuera de la hoja
    await lienzo.click({ position: { x: caja.width * fx, y: caja.height * fy } });
    await pas.getByTestId('costo').waitFor();
    await dormir(2500);
    await foto(pas, 'pasajero-eligiendo');
  }
  await pas.getByTestId('rapido-0').click();
  await pas.getByTestId('pedir').click();
  await con.locator('[data-testid^="aceptar-"]').first().click();
  await con.getByTestId('accion').click(); // Ir a recoger
  await dormir(3500); // mapa listo y coche a medio tramo
  if (quiero.includes('camino')) await foto(pas, 'pasajero-en-camino');
  if (quiero.includes('curso')) {
    await con.getByTestId('accion').filter({ hasText: 'Iniciar viaje' }).click();
    await dormir(3500);
    await foto(con, 'conductor-en-curso');
  }
  await ctx.close();
}
await browser.close();
