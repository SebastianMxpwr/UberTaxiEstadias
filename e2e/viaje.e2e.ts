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
  // Las dos pestañas a la vez: el aviso del perdedor se quita solo a los 4 s.
  const resultado = (c: typeof c1) => {
    const gana = c.getByTestId('estado').waitFor({ timeout: 10_000 }).then(() => 'gano');
    const pierde = aviso(c).waitFor({ timeout: 10_000 }).then(() => 'perdio');
    gana.catch(() => {}); pierde.catch(() => {});
    return Promise.any([gana, pierde]);
  };
  const r = await Promise.all([c1, c2].map(resultado));
  expect(r.sort()).toEqual(['gano', 'perdio']);
  await expect(pas.getByTestId('estado')).toHaveText('Conductor asignado');
});
