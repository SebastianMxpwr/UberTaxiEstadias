import { Component, ElementRef, OnDestroy, afterNextRender, computed, effect, input, signal, viewChild } from '@angular/core';
import { GeoJSONSource, LngLatBounds, Map, Marker, setWorkerUrl } from 'maplibre-gl';
import { LngLat, Viaje } from '../viaje/estado';

const linea = (c: LngLat[] = []) => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: c } });

@Component({
  selector: 'app-mapa-viaje',
  template: `
    <div #el class="mapa"></div>
    <span class="oculto" data-testid="posicion">{{ posicion() }}</span>
  `,
  styles: `
    :host { display: block; }
    .mapa { height: 45vh; min-height: 280px; border-radius: 12px; overflow: hidden; }
    .oculto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
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

  constructor() {
    afterNextRender(() => {
      // El bundler mueve maplibre a un chunk: el worker (copiado a assets) ya no queda a su lado.
      setWorkerUrl(new URL('maplibre-gl-worker.mjs', document.baseURI).href);
      this.mapa = new Map({
        container: this.el().nativeElement,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-99.15, 19.43],
        zoom: 12,
      });
      this.mapa.on('load', () => {
        const m = this.mapa!;
        m.addSource('recogida', { type: 'geojson', data: linea() });
        m.addSource('viaje', { type: 'geojson', data: linea() });
        m.addLayer({ id: 'recogida', type: 'line', source: 'recogida', paint: { 'line-color': '#000', 'line-width': 3, 'line-dasharray': [2, 2] } });
        m.addLayer({ id: 'viaje-borde', type: 'line', source: 'viaje', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#000', 'line-width': 9 } });
        m.addLayer({ id: 'viaje', type: 'line', source: 'viaje', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#FFD600', 'line-width': 5 } });
        this.listo.set(true);
      });
    });
    effect(() => {
      const v = this.viaje();
      if (this.listo() && v) this.dibujar(v);
    });
  }

  private dibujar(v: Viaje): void {
    const m = this.mapa!;
    (m.getSource('recogida') as GeoJSONSource).setData(linea(v.rutaRecogida));
    (m.getSource('viaje') as GeoJSONSource).setData(linea(v.rutaViaje));
    if (this.idAjustado !== v.id) {
      this.idAjustado = v.id;
      this.marcadores.forEach((x) => x.remove());
      this.marcadores = [
        new Marker({ color: '#000' }).setLngLat(v.origen.lngLat).addTo(m),
        new Marker({ color: '#FFD600' }).setLngLat(v.destino.lngLat).addTo(m),
      ];
      const b = new LngLatBounds();
      [...v.rutaRecogida, ...v.rutaViaje].forEach((p) => b.extend(p));
      m.fitBounds(b, { padding: 40, animate: false });
    }
    if (v.posicion) {
      if (!this.coche) {
        const img = document.createElement('img');
        img.src = 'carro.png';
        img.alt = 'Coche';
        img.style.height = '40px';
        this.coche = new Marker({ element: img }).setLngLat(v.posicion).addTo(m);
      } else this.coche.setLngLat(v.posicion);
    } else {
      this.coche?.remove();
      this.coche = undefined;
    }
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
