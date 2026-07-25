import type { Fingerprint } from '@/types'

/**
 * Mapping and geolocation.
 *
 * Map tiles are fetched from the provider as the user pans, so both the library
 * and the tile host are visible.
 */
export const MAPS: Fingerprint[] = [
  {
    id: 'google-maps',
    name: 'Google Maps',
    category: 'maps',
    description: 'Maps, places, and geocoding',
    icon: 'googlemaps',
    website: 'https://developers.google.com/maps',
    signals: [
      { type: 'global', path: 'google.maps', weight: 0.95 },
      { type: 'script', pattern: /maps\.googleapis\.com\/maps\/api\/js/, weight: 0.95 },
      { type: 'request', pattern: /maps\.(?:googleapis|gstatic)\.com/, weight: 0.9 },
      { type: 'dom', selector: 'iframe[src*="google.com/maps/embed"]', weight: 0.9 },
    ],
  },
  {
    id: 'mapbox',
    name: 'Mapbox',
    category: 'maps',
    description: 'Custom maps and navigation',
    icon: 'mapbox',
    website: 'https://mapbox.com',
    signals: [
      { type: 'global', path: 'mapboxgl', weight: 0.95 },
      { type: 'request', pattern: /(?:api|events)\.mapbox\.com/, weight: 0.95 },
      { type: 'script', pattern: /mapbox-gl(?:\.min)?\.js/, weight: 0.95 },
    ],
    version: [{ from: 'global', path: 'mapboxgl.version' }],
  },
  {
    id: 'leaflet',
    name: 'Leaflet',
    category: 'maps',
    description: 'Open-source mapping library',
    icon: 'leaflet',
    website: 'https://leafletjs.com',
    signals: [
      { type: 'global', path: 'L.version', weight: 0.9 },
      { type: 'script', pattern: /leaflet(?:\.min)?\.js/, weight: 0.9 },
      { type: 'dom', selector: '.leaflet-container', weight: 0.9 },
    ],
    version: [{ from: 'global', path: 'L.version' }],
  },
  {
    id: 'maplibre',
    name: 'MapLibre',
    category: 'maps',
    description: 'Open-source fork of Mapbox GL',
    icon: 'maplibre',
    website: 'https://maplibre.org',
    signals: [
      { type: 'global', path: 'maplibregl', weight: 0.95 },
      { type: 'script', pattern: /maplibre-gl(?:\.min)?\.js/, weight: 0.95 },
    ],
  },
  {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    category: 'maps',
    description: 'Community-maintained map data',
    icon: 'openstreetmap',
    website: 'https://openstreetmap.org',
    signals: [
      { type: 'request', pattern: /tile\.openstreetmap\.org|[abc]\.tile\.osm\.org/, weight: 0.95 },
    ],
  },
  {
    id: 'here-maps',
    name: 'HERE Maps',
    category: 'maps',
    description: 'Mapping and location services',
    icon: 'here',
    website: 'https://here.com',
    signals: [
      { type: 'global', path: 'H.Map', weight: 0.9 },
      { type: 'request', pattern: /\.hereapi\.com|\.api\.here\.com/, weight: 0.95 },
      { type: 'script', pattern: /js\.api\.here\.com\/v3/, weight: 0.95 },
    ],
  },
  {
    id: 'tomtom-maps',
    name: 'TomTom',
    category: 'maps',
    description: 'Maps, routing, and traffic',
    icon: 'tomtom',
    website: 'https://developer.tomtom.com',
    signals: [
      { type: 'global', path: 'tt.map', weight: 0.9 },
      { type: 'request', pattern: /api\.tomtom\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'azure-maps',
    name: 'Azure Maps',
    category: 'maps',
    description: "Microsoft's mapping platform",
    icon: 'microsoftazure',
    website: 'https://azure.microsoft.com/products/azure-maps',
    signals: [
      { type: 'global', path: 'atlas.Map', weight: 0.9 },
      { type: 'request', pattern: /atlas\.microsoft\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'arcgis',
    name: 'Esri ArcGIS',
    category: 'maps',
    description: 'Geographic information systems',
    icon: 'esri',
    website: 'https://developers.arcgis.com',
    signals: [
      { type: 'request', pattern: /(?:services|tiles|js)\.arcgis(?:online)?\.com/, weight: 0.95 },
      { type: 'script', pattern: /js\.arcgis\.com\/\d/, weight: 0.95 },
    ],
  },
  {
    id: 'yandex-maps',
    name: 'Yandex Maps',
    category: 'maps',
    description: 'Mapping across Russia and the CIS',
    icon: 'yandex',
    website: 'https://yandex.com/maps',
    signals: [
      { type: 'global', path: 'ymaps', weight: 0.9 },
      { type: 'script', pattern: /api-maps\.yandex\.(?:ru|com)/, weight: 0.95 },
    ],
  },
  {
    id: 'radar',
    name: 'Radar',
    category: 'maps',
    description: 'Geofencing and location SDK',
    icon: 'radar',
    website: 'https://radar.com',
    signals: [
      { type: 'global', path: 'Radar', weight: 0.85 },
      { type: 'request', pattern: /api(?:-verified)?\.radar\.io/, weight: 0.95 },
    ],
  },
  {
    id: 'geoapify',
    name: 'Geoapify',
    category: 'maps',
    description: 'Geocoding and map tiles',
    icon: 'geoapify',
    website: 'https://geoapify.com',
    signals: [
      { type: 'request', pattern: /(?:api|maps)\.geoapify\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'openlayers',
    name: 'OpenLayers',
    category: 'maps',
    description: 'Open-source map rendering library',
    icon: 'openlayers',
    website: 'https://openlayers.org',
    signals: [
      { type: 'script', pattern: /\bol(?:\.min)?\.js|openlayers/, weight: 0.85 },
      { type: 'dom', selector: '.ol-viewport, .ol-zoom', weight: 0.9 },
    ],
  },
  {
    id: 'maptiler',
    name: 'MapTiler',
    category: 'maps',
    description: 'Hosted vector map tiles',
    icon: 'maptiler',
    website: 'https://maptiler.com',
    signals: [
      { type: 'request', pattern: /api\.maptiler\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'google-places',
    name: 'Google Places',
    category: 'maps',
    description: 'Place search and autocomplete',
    icon: 'googlemaps',
    website: 'https://developers.google.com/maps/documentation/places',
    signals: [
      { type: 'global', path: 'google.maps.places', weight: 0.9 },
      { type: 'dom', selector: '.pac-container, .pac-item', weight: 0.9 },
    ],
    implies: ['google-maps'],
  },
]
