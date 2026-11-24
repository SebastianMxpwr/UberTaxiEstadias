// Saca las capturas del README. Necesita `npm start` corriendo en :4310.
// Uso: node e2e/capturas.mjs
import { chromium } from '@playwright/test';

const base = 'http://localhost:4310';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const pas = await ctx.newPage();
const con = await ctx.newPage();
await pas.goto(`${base}/pasajero?vel=4`); // tramo de 5 s
await con.goto(`${base}/conductor?vel=4`);

await pas.getByTestId('pedir').click();
await con.locator('[data-testid^="aceptar-"]').first().click();
await con.getByTestId('accion').click(); // Ir a recoger
await dormir(3500); // mapa listo y coche a medio tramo
await pas.screenshot({ path: 'docs/capturas/pasajero-en-camino.png' });

await con.getByTestId('accion').filter({ hasText: 'Iniciar viaje' }).click();
await dormir(3500);
await con.screenshot({ path: 'docs/capturas/conductor-en-curso.png' });
await browser.close();
