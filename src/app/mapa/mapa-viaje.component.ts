import { Component, ElementRef, OnDestroy, afterNextRender, computed, effect, input, signal, viewChild } from '@angular/core';
import { GeoJSONSource, LngLatBounds, Map, Marker, setWorkerUrl } from 'maplibre-gl';
import { LngLat, Viaje } from '../viaje/estado';

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
  protected readonly posicion = computed(() => this.viaje()?.posicion?.map((n) => n.toFixed(5)).join(',') ?? '');

  private readonly el = viewChild.required<ElementRef<HTMLDivElement>>('el');
  private readonly listo = signal(false);
  private mapa?: Map;
  private coche?: Marker;
  private marcadores: Marker[] = [];
  private idAjustado?: string;
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
      if (!this.listo()) return;
      if (v) this.dibujar(v); else this.limpiar();
    });
  }

  private limpiar(): void {
    const m = this.mapa!;
    (m.getSource('recogida') as GeoJSONSource).setData(linea());
    (m.getSource('viaje') as GeoJSONSource).setData(linea());
    [...this.marcadores, this.coche].forEach((x) => x?.remove());
    this.marcadores = [];
    this.coche = undefined;
    this.idAjustado = undefined;
  }

  private dibujar(v: Viaje): void {
    const m = this.mapa!;
    (m.getSource('recogida') as GeoJSONSource).setData(linea(v.rutaRecogida));
    (m.getSource('viaje') as GeoJSONSource).setData(linea(v.rutaViaje));
    if (this.idAjustado !== v.id) {
      this.idAjustado = v.id;
      this.marcadores.forEach((x) => x.remove());
      this.marcadores = [
        new Marker({ color: oscuro() ? '#f5f5f5' : '#000' }).setLngLat(v.origen.lngLat).addTo(m),
        new Marker({ color: '#FFD600' }).setLngLat(v.destino.lngLat).addTo(m),
      ];
      const b = new LngLatBounds();
      [...v.rutaRecogida, ...v.rutaViaje].forEach((p) => b.extend(p));
      m.fitBounds(b, { padding: 40, animate: false });
    }
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
