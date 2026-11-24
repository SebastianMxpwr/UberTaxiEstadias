// Pide UNA vez a OSRM las rutas de los 3 viajes semilla y las guarda en el JSON versionado.
import { writeFileSync } from 'node:fs';

const viajes = [
  { nombre: 'Zócalo → Ángel de la Independencia', costo: 95, inicio: [-99.1413, 19.4352],
    origen: { nombre: 'Zócalo', lngLat: [-99.1332, 19.4326] }, destino: { nombre: 'Ángel de la Independencia', lngLat: [-99.1677, 19.4270] } },
  { nombre: 'Bellas Artes → Museo Soumaya', costo: 140, inicio: [-99.1440, 19.4340],
    origen: { nombre: 'Bellas Artes', lngLat: [-99.1413, 19.4352] }, destino: { nombre: 'Museo Soumaya', lngLat: [-99.2048, 19.4406] } },
  { nombre: 'Coyoacán → Ciudad Universitaria', costo: 110, inicio: [-99.1760, 19.3540],
    origen: { nombre: 'Jardín Centenario', lngLat: [-99.1626, 19.3500] }, destino: { nombre: 'Rectoría UNAM', lngLat: [-99.1871, 19.3324] } },
];

async function ruta(a, b) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.join(',')};${b.join(',')}?overview=full&geometries=geojson`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OSRM ${r.status}`);
  return (await r.json()).routes[0].geometry.coordinates;
}

const salida = [];
for (const v of viajes) {
  const { inicio, ...resto } = v;
  salida.push({
    ...resto, inicioConductor: inicio,
    rutaRecogida: await ruta(inicio, v.origen.lngLat),
    rutaViaje: await ruta(v.origen.lngLat, v.destino.lngLat),
  });
}
writeFileSync(new URL('../src/app/viaje/rutas-semilla.json', import.meta.url), JSON.stringify(salida));
console.log(salida.map((s) => `${s.nombre}: ${s.rutaRecogida.length}+${s.rutaViaje.length} puntos`).join('\n'));
