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
]
