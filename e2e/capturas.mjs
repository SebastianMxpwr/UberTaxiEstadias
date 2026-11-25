// Saca las capturas del README. Necesita `npx ng serve --port 4310` corriendo.
// Uso: node e2e/capturas.mjs
import { chromium } from '@playwright/test';

const base = 'http://localhost:4310';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });

// [ancho, alto, tema, sufijo, qué capturar]
const corridas = [
  [375, 812, 'claro', '375', ['inicio', 'eligiendo', 'camino', 'curso']],
  [1440, 900, 'claro', '1440', ['inicio', 'eligiendo', 'camino', 'curso']],
  [1280, 560, 'claro', '1280x560', ['camino']],
  [1440, 900, 'oscuro', '1440-oscuro', ['camino', 'curso']],
];

for (const [width, height, tema, sufijo, quiero] of corridas) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await ctx.addInitScript((t) => localStorage.setItem('pv.tema', t), tema);
  const pas = await ctx.newPage();
  const con = await ctx.newPage();
  const foto = (p, nombre) => p.screenshot({ path: `docs/capturas/${nombre}-${sufijo}.png` });

  if (quiero.includes('inicio')) { await pas.goto(base); await dormir(800); await foto(pas, 'inicio'); }
  await pas.goto(`${base}/pasajero?vel=4`); // tramo de 5 s
  await con.goto(`${base}/conductor?vel=4`);
  if (quiero.includes('eligiendo')) {
    await pas.locator('.opcion').nth(1).click();
    await dormir(2500); // mapa y tipografías listos
    await foto(pas, 'pasajero-eligiendo');
  }
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
