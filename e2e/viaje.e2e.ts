import { expect, test } from '@playwright/test';

// Modo Firestore (playwright.firestore.config.ts): base limpia antes de cada prueba.
test.beforeEach(async ({ request }) => {
  if (process.env['E2E_FIRESTORE']) await request.delete('http://127.0.0.1:8080/emulator/v1/projects/demo-traslados/databases/(default)/documents');
});

test('pasajero pide, conductor acepta y completa; el coche se mueve', async ({ context }) => {
  const pas = await context.newPage();
  const con = await context.newPage();
  await pas.goto('/pasajero?vel=20');
  await con.goto('/conductor?vel=20');

  await pas.getByTestId('pedir').click();
  await expect(pas.getByTestId('estado')).toHaveText('Buscando conductor');

  await con.locator('[data-testid^="aceptar-"]').first().click();
  await expect(pas.getByTestId('estado')).toHaveText('Conductor asignado');

  await con.getByTestId('accion').click(); // Ir a recoger
  await expect(pas.getByTestId('estado')).toHaveText('Tu conductor va en camino');
  const posicion = pas.getByTestId('posicion');
  await expect(posicion).not.toHaveText('');
  const primera = await posicion.textContent();

  await expect(con.getByTestId('accion')).toHaveText('Iniciar viaje');
  await con.getByTestId('accion').click();
  await expect(pas.getByTestId('estado')).toHaveText('En viaje');
  await expect(con.getByTestId('accion')).toHaveText('Terminar');
  await con.getByTestId('accion').click();

  await expect(pas.getByTestId('estado')).toHaveText('Llegaste');
  await expect(posicion).not.toHaveText(primera!);
});

test('dos conductores aceptan a la vez: uno gana y el otro ve el aviso', async ({ context }) => {
  const pas = await context.newPage();
  const c1 = await context.newPage();
  const c2 = await context.newPage();
  await Promise.all([pas.goto('/pasajero'), c1.goto('/conductor'), c2.goto('/conductor')]);

  await pas.getByTestId('pedir').click();
  await expect(pas.getByTestId('estado')).toHaveText('Buscando conductor');
  const aceptar = [c1, c2].map((c) => c.locator('[data-testid^="aceptar-"]').first());
  await Promise.all(aceptar.map((b) => expect(b).toBeVisible()));
  // click() directo en el DOM de ambas páginas: salen casi en el mismo instante (b.click() espera actionability y llegaría tarde)
  await Promise.all(aceptar.map((b) => b.evaluate((el: HTMLElement) => el.click())));

  const aviso = (c: typeof c1) => c.getByText('ya lo tomó otro conductor');
  for (const c of [c1, c2]) await expect(c.getByTestId('estado').or(aviso(c))).toBeVisible();

  const gano = await Promise.all([c1, c2].map((c) => c.getByTestId('estado').isVisible()));
  expect(gano.filter(Boolean)).toHaveLength(1);
  const perdedor = gano[0] ? c2 : c1;
  await expect(aviso(perdedor)).toBeVisible();
  await expect(pas.getByTestId('estado')).toHaveText('Conductor asignado');
});
