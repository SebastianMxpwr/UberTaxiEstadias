import { Component, ElementRef, OnDestroy, afterNextRender, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { GeoJSONSource, LngLatBounds, Map, Marker, setWorkerUrl } from 'maplibre-gl';
import { LngLat, Lugar, Viaje } from '../viaje/estado';

/** Vista previa mientras el pasajero elige su viaje. */
export interface Borrador { origen?: Lugar; destino?: Lugar; rutaViaje?: LngLat[]; rutaRecogida?: LngLat[] }

const ESTILOS = { claro: 'https://tiles.openfreemap.org/styles/liberty', oscuro: 'https://tiles.openfreemap.org/styles/dark' };
const oscuro = () => document.documentElement.dataset['tema'] === 'oscuro';
const linea = (c: LngLat[] = []) => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: c } });

@Component({
  selector: 'app-mapa-viaje',
  template: `
    <div #el class="mapa"></div>
    <span class="oculto" data-testid="posicion">{{ posicion() }}</span>
  `,
  styles: `
    :host { display: block; position: relative; overflow: hidden; }
    .mapa { position: absolute; inset: 0; }
  `,
})
export class MapaViajeComponent implements OnDestroy {
  readonly viaje = input<Viaje>();
  readonly borrador = input<Borrador>();
  readonly seleccionable = input(false);
  readonly toque = output<LngLat>();
  protected readonly posicion = computed(() => this.viaje()?.posicion?.map((n) => n.toFixed(5)).join(',') ?? '');

  private readonly el = viewChild.required<ElementRef<HTMLDivElement>>('el');
  private readonly listo = signal(false);
  private mapa?: Map;
  private coche?: Marker;
  private marcadores: Marker[] = [];
  private clave?: string;
  private observadores: { disconnect(): void }[] = [];

  constructor() {
    afterNextRender(() => {
      // El bundler mueve maplibre a un chunk: el worker (copiado a assets) ya no queda a su lado.
      setWorkerUrl(new URL('maplibre-gl-worker.mjs', document.baseURI).href);
      this.mapa = new Map({
        container: this.el().nativeElement,
        style: oscuro() ? ESTILOS.oscuro : ESTILOS.claro,
        center: [-99.15, 19.43],
        zoom: 12,
      });
      // 'style.load' se repite al cambiar de estilo (tema): las capas propias se vuelven a poner.
      this.mapa.on('style.load', () => {
        const m = this.mapa!;
        m.addSource('recogida', { type: 'geojson', data: linea() });
        m.addSource('viaje', { type: 'geojson', data: linea() });
        m.addLayer({ id: 'recogida', type: 'line', source: 'recogida', paint: { 'line-color': oscuro() ? '#c8c8c0' : '#3a3a36', 'line-width': 3, 'line-dasharray': [2, 2] } });
        m.addLayer({ id: 'viaje-borde', type: 'line', source: 'viaje', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#000', 'line-width': 9 } });
        m.addLayer({ id: 'viaje', type: 'line', source: 'viaje', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#FFD600', 'line-width': 5 } });
        this.listo.set(false);
        this.listo.set(true);
      });
      this.mapa.on('click', (e) => { if (this.seleccionable()) this.toque.emit([e.lngLat.lng, e.lngLat.lat]); });
      const tamano = new ResizeObserver(() => this.mapa?.resize());
      tamano.observe(this.el().nativeElement);
      let actual = oscuro();
      const tema = new MutationObserver(() => {
        if (oscuro() !== actual) { actual = oscuro(); this.mapa?.setStyle(actual ? ESTILOS.oscuro : ESTILOS.claro); }
      });
      tema.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
      this.observadores = [tamano, tema];
    });
    effect(() => {
      const v = this.viaje();
      const b = this.borrador();
      if (!this.listo()) return;
      if (v) this.dibujar(v); else this.dibujarBorrador(b ?? {});
    });
    effect(() => {
      const sel = this.seleccionable();
      if (this.listo()) this.mapa!.getCanvas().style.cursor = sel ? 'crosshair' : '';
    });
  }

  /** Margen para que la ruta no quede bajo la hoja (solo en celular, donde la hoja tapa el mapa). */
  private relleno(): { top: number; left: number; right: number; bottom: number } {
    const hoja = document.querySelector<HTMLElement>('.hoja');
    const celular = !matchMedia('(min-width: 900px)').matches;
    return { top: 40, left: 40, right: 40, bottom: 40 + (celular && hoja ? hoja.offsetHeight : 0) };
  }

  private pintar(clave: string, origen?: Lugar, destino?: Lugar, recogida: LngLat[] = [], viaje: LngLat[] = []): void {
    const m = this.mapa!;
    (m.getSource('recogida') as GeoJSONSource).setData(linea(recogida));
    (m.getSource('viaje') as GeoJSONSource).setData(linea(viaje));
    if (this.clave === clave) return;
    this.clave = clave;
    this.marcadores.forEach((x) => x.remove());
    this.marcadores = [
      origen && new Marker({ color: oscuro() ? '#f5f5f5' : '#000' }).setLngLat(origen.lngLat).addTo(m),
      destino && new Marker({ color: '#FFD600' }).setLngLat(destino.lngLat).addTo(m),
    ].filter((x) => !!x);
    const b = new LngLatBounds();
    [...recogida, ...viaje, ...[origen, destino].flatMap((l) => (l ? [l.lngLat] : []))].forEach((p) => b.extend(p));
    if (!b.isEmpty()) m.fitBounds(b, { padding: this.relleno(), maxZoom: 15, animate: false });
  }

  private dibujarBorrador(b: Borrador): void {
    this.pintar(`b${b.origen?.lngLat}|${b.destino?.lngLat}|${b.rutaViaje?.length}`, b.origen, b.destino, b.rutaRecogida, b.rutaViaje);
    this.coche?.remove();
    this.coche = undefined;
  }

  private dibujar(v: Viaje): void {
    const m = this.mapa!;
    this.pintar(v.id, v.origen, v.destino, v.rutaRecogida, v.rutaViaje);
    if (v.posicion) {
      if (!this.coche) {
        // carro.png de 2021 se ve pixelado a este tamaño: ficha amarilla con el ícono de taxi.
        const el = document.createElement('div');
        el.className = 'coche-mapa';
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', 'Coche');
        el.innerHTML = '<span class="icono" aria-hidden="true">local_taxi</span>';
        this.coche = new Marker({ element: el }).setLngLat(v.posicion).addTo(m);
      } else this.coche.setLngLat(v.posicion);
    } else {
      this.coche?.remove();
      this.coche = undefined;
    }
  }

  ngOnDestroy(): void {
    this.observadores.forEach((o) => o.disconnect());
    this.mapa?.remove();
  }
}
