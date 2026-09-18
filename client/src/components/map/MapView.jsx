import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Navigation,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Search,
  Maximize2,
  Compass,
  Layers,
  MapPin,
  Eye,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { formatINR } from '../../utils/currency';

// Read public Mapbox token from Vite environment
const MAPBOX_ENV_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();

// Check if token is a genuine, non-placeholder public Mapbox token
const isConfiguredToken =
  Boolean(MAPBOX_ENV_TOKEN) &&
  MAPBOX_ENV_TOKEN.startsWith('pk.') &&
  !MAPBOX_ENV_TOKEN.includes('placeholder') &&
  !MAPBOX_ENV_TOKEN.includes('sample');

// High-resolution Mapbox Style Specification with Carto Voyager basemap (vector-compatible raster)
const CARTO_VOYAGER_STYLE = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CARTO</a>'
    }
  },
  layers: [
    {
      id: 'carto-voyager-layer',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

// Official Mapbox vector styles
const MAPBOX_STANDARD_STYLE = 'mapbox://styles/mapbox/standard';
const MAPBOX_STREETS_STYLE = 'mapbox://styles/mapbox/streets-v12';

// Destination quick-jump presets
const DESTINATION_PRESETS = [
  { name: 'Tokyo', center: [139.6921, 35.6905], zoom: 12 },
  { name: 'New York', center: [-73.9842, 40.7592], zoom: 12 },
  { name: 'Paris', center: [2.3082, 48.8661], zoom: 12 },
  { name: 'London', center: [-0.1444, 51.5074], zoom: 12 },
  { name: 'Bali', center: [115.2415, -8.4872], zoom: 11 }
];

// Helper: Coordinate validity check
const isValidCoordinate = (lng, lat) =>
  typeof lng === 'number' &&
  typeof lat === 'number' &&
  !isNaN(lng) &&
  !isNaN(lat) &&
  lng >= -180 &&
  lng <= 180 &&
  lat >= -90 &&
  lat <= 90;

const MapView = ({
  hotels = [],
  selectedHotelId = null,
  hoveredHotelId = null,
  onMarkerClick = null,
  onDestinationSelect = null,
  center = null,
  zoom = 12,
  interactive = true,
  height = '100%'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const popupRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [criticalError, setCriticalError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [userLocationLoading, setUserLocationLoading] = useState(false);
  const [activeDestination, setActiveDestination] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);

  // Grouping / Clustering: detect if hotels should display cluster summary when zoomed out
  const shouldCluster = useMemo(() => {
    return hotels.length >= 6 && currentZoom < 10;
  }, [hotels.length, currentZoom]);

  // 1. Initialize Mapbox GL JS Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if browser supports WebGL
    if (!mapboxgl.supported()) {
      setCriticalError(
        'WebGL is not supported or hardware acceleration is disabled in your browser. Mapbox requires WebGL to render interactive maps.'
      );
      return;
    }

    // When no real token is configured and preview mode is not enabled, do NOT send 401s to api.mapbox.com
    if (!isConfiguredToken && !previewMode) {
      // Clean up previous map if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapLoaded(false);
      }
      return;
    }

    try {
      // Configure Mapbox Token
      const token = isConfiguredToken ? MAPBOX_ENV_TOKEN : 'pk.preview_mapbox_standalone_engine';
      mapboxgl.accessToken = token;

      // Determine initial center
      let initialCenter = [-73.9842, 40.7592]; // Midtown Manhattan default
      if (center && isValidCoordinate(center[0], center[1])) {
        initialCenter = [center[0], center[1]];
      } else if (hotels.length > 0) {
        const first = hotels[0];
        const lng = first.longitude || first.location?.coordinates?.[0];
        const lat = first.latitude || first.location?.coordinates?.[1];
        if (isValidCoordinate(lng, lat)) {
          initialCenter = [lng, lat];
        }
      }

      // Determine style: Use Mapbox standard vector style if real token; otherwise Carto Voyager
      const initialStyle = isConfiguredToken ? MAPBOX_STANDARD_STYLE : CARTO_VOYAGER_STYLE;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: initialCenter,
        zoom: zoom,
        interactive: interactive,
        attributionControl: true,
        accessToken: token
      });

      // Add standard navigation controls (zoom in/out, compass)
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

      // Add Fullscreen control
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Track zoom level for dynamic clustering / price label sizing
      map.on('zoom', () => {
        setCurrentZoom(map.getZoom());
      });

      map.on('load', () => {
        mapInstanceRef.current = map;
        setMapLoaded(true);
        map.resize();
      });

      // Handle style fallback if standard style fails
      map.on('error', (e) => {
        const status = e.error?.status;
        const msg = e.error?.message || '';

        // Catch 401 Unauthorized errors from revoked or expired tokens
        if (status === 401 || status === 403 || msg.includes('Not Authorized') || msg.includes('Invalid Token')) {
          console.warn('[Mapbox Auth Warning]: Mapbox API token unauthorized:', msg);
          setAuthError('Configured Mapbox token is not authorized. Please check your token permissions on mapbox.com.');
        }
      });

      // Observe container resize for responsive re-renders
      let resizeObserver = null;
      if (window.ResizeObserver && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.resize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      const t1 = setTimeout(() => map.resize(), 100);
      const t2 = setTimeout(() => map.resize(), 350);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        if (resizeObserver) resizeObserver.disconnect();
        if (popupRef.current) popupRef.current.remove();
        if (userMarkerRef.current) userMarkerRef.current.remove();
        map.remove();
        mapInstanceRef.current = null;
        setMapLoaded(false);
      };
    } catch (err) {
      console.error('[Mapbox Init Error]:', err);
      setCriticalError(err.message || 'Failed to initialize Mapbox GL map');
    }
  }, [isConfiguredToken, previewMode]);

  // 2. Synchronize Hotel Markers and Interactive Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    if (!hotels || hotels.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    let validCoordsCount = 0;

    hotels.forEach((hotel) => {
      const lng = hotel.longitude || hotel.location?.coordinates?.[0];
      const lat = hotel.latitude || hotel.location?.coordinates?.[1];

      if (!isValidCoordinate(lng, lat)) return;

      bounds.extend([lng, lat]);
      validCoordsCount++;

      // Create Custom Price Pill Marker Element
      const el = document.createElement('div');
      el.className = `stayzio-price-marker ${
        selectedHotelId === hotel._id ? 'active' : hoveredHotelId === hotel._id ? 'hovered' : ''
      }`;
      el.id = `map-marker-${hotel._id}`;

      // Responsive price text: ₹18,500 or ₹18.5k
      const priceText = formatINR(hotel.priceFrom);
      el.innerHTML = `<span>${priceText}</span>`;

      // Marker click handler: Open popup & trigger synchronization
      el.addEventListener('click', (e) => {
        e.stopPropagation();

        if (onMarkerClick) {
          onMarkerClick(hotel);
        }

        // Map-to-card synchronization: scroll hotel card into view
        const targetCard = document.getElementById(`hotel-card-${hotel._id}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Remove any existing popup
        if (popupRef.current) popupRef.current.remove();

        const popupHTML = `
          <div class="map-popup-card">
            <img src="${hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}" alt="${hotel.name}" class="map-popup-image" />
            <div class="map-popup-body">
              <div class="map-popup-title">${hotel.name}</div>
              <div class="map-popup-rating">
                <span class="star">★</span>
                <span class="score">${hotel.rating > 0 ? hotel.rating.toFixed(1) : 'New'}</span>
                <span class="count">(${hotel.reviewCount || 0} reviews)</span>
              </div>
              <div class="map-popup-location">${hotel.city}, ${hotel.country}</div>
              <div class="map-popup-footer">
                <div>
                  <span class="map-popup-price">${formatINR(hotel.priceFrom)}</span>
                  <span class="map-popup-night"> / night</span>
                </div>
                <a href="/hotels/${hotel._id}" class="map-popup-link">View Hotel &rarr;</a>
              </div>
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, maxWidth: '280px' })
          .setLngLat([lng, lat])
          .setHTML(popupHTML)
          .addTo(map);

        popupRef.current = popup;

        map.flyTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 13),
          duration: 700,
          essential: true
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current[hotel._id] = marker;
    });

    // Auto-fit bounds if multiple hotels; or fly to single hotel
    if (validCoordsCount > 1 && !selectedHotelId && !center) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
    } else if (validCoordsCount === 1) {
      const single = hotels[0];
      const lng = single.longitude || single.location?.coordinates?.[0];
      const lat = single.latitude || single.location?.coordinates?.[1];
      if (isValidCoordinate(lng, lat)) {
        map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
      }
    }
  }, [mapLoaded, hotels]);

  // 3. Card-to-Map Hover & Selection Synchronization
  useEffect(() => {
    const activeId = selectedHotelId || hoveredHotelId;

    Object.entries(markersRef.current).forEach(([hotelId, marker]) => {
      const el = marker.getElement();
      if (hotelId === selectedHotelId) {
        el.classList.add('active');
        el.classList.remove('hovered');
      } else if (hotelId === hoveredHotelId) {
        el.classList.add('hovered');
        el.classList.remove('active');
      } else {
        el.classList.remove('active', 'hovered');
      }
    });

    // Center map on selected hotel
    if (selectedHotelId && mapInstanceRef.current) {
      const hotel = hotels.find((h) => h._id === selectedHotelId);
      if (hotel) {
        const lng = hotel.longitude || hotel.location?.coordinates?.[0];
        const lat = hotel.latitude || hotel.location?.coordinates?.[1];
        if (isValidCoordinate(lng, lat)) {
          mapInstanceRef.current.flyTo({
            center: [lng, lat],
            zoom: Math.max(mapInstanceRef.current.getZoom(), 14),
            duration: 600,
            essential: true
          });
        }
      }
    }
  }, [selectedHotelId, hoveredHotelId, hotels]);

  // 4. Geolocation Action Handler: "Use My Location"
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setUserLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocationLoading(false);
        const { longitude, latitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 13,
            duration: 1200,
            essential: true
          });

          // Add or move user location marker
          if (userMarkerRef.current) userMarkerRef.current.remove();

          const userEl = document.createElement('div');
          userEl.className = 'stayzio-user-location-marker';
          userEl.title = 'Your Current Location';

          userMarkerRef.current = new mapboxgl.Marker({ element: userEl })
            .setLngLat([longitude, latitude])
            .addTo(mapInstanceRef.current);
        }
      },
      (error) => {
        setUserLocationLoading(false);
        console.warn('Geolocation lookup notice:', error.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 5. Destination Quick Jump Handler
  const handleJumpToDestination = (dest) => {
    setActiveDestination(dest.name);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: dest.center,
        zoom: dest.zoom,
        duration: 900,
        essential: true
      });
    }
    if (onDestinationSelect) {
      onDestinationSelect(dest.name);
    }
  };

  // Critical Error State (e.g. WebGL completely unavailable)
  if (criticalError) {
    return (
      <div className="map-error-container" style={{ height }}>
        <div className="map-error-card">
          <AlertTriangle size={32} color="#dc2626" style={{ margin: '0 auto 1rem auto' }} />
          <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Hardware Acceleration Required</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            {criticalError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={15} /> Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Developer Configuration Screen: Rendered when token is unconfigured (without firing 401s to api.mapbox.com)
  if (!isConfiguredToken && !previewMode) {
    return (
      <div className="map-config-screen" style={{ height }}>
        <div className="map-config-card">
          <div className="map-config-header">
            <div className="map-config-icon-wrap">
              <Compass size={28} />
            </div>
            <h3>Mapbox Token Configuration Required</h3>
            <p className="map-config-subtitle">
              The application is configured with placeholder credentials. To render official Mapbox Standard vector maps with live tiles:
            </p>
          </div>

          <div className="map-config-steps">
            <div className="map-config-step">
              <span className="step-num">1</span>
              <div>
                <strong>Get your Free Public Token</strong>
                <p>Create a free account and copy your public token from the Mapbox dashboard.</p>
                <a
                  href="https://account.mapbox.com/access-tokens/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-config-link"
                >
                  account.mapbox.com/access-tokens <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="map-config-step">
              <span className="step-num">2</span>
              <div>
                <strong>Update client/.env</strong>
                <pre className="map-config-code">VITE_MAPBOX_TOKEN=pk.your_actual_token_here</pre>
              </div>
            </div>

            <div className="map-config-step">
              <span className="step-num">3</span>
              <div>
                <strong>Restart Vite Client</strong>
                <p>Restart the development server (<code>npm run dev</code>) so Vite loads the new variable.</p>
              </div>
            </div>
          </div>

          <div className="map-config-footer">
            <button
              onClick={() => setPreviewMode(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
            >
              <Eye size={16} /> Preview Interactive Map with Standalone Engine
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container" style={{ height }}>
      {/* Floating Destination Quick Jump Bar */}
      {hotels.length > 1 && (
        <div className="map-destination-bar" role="navigation" aria-label="Quick jump destinations">
          <div className="map-destination-title">
            <Search size={13} />
            <span>Destinations:</span>
          </div>
          <div className="map-destination-chips">
            {DESTINATION_PRESETS.map((dest) => (
              <button
                key={dest.name}
                onClick={() => handleJumpToDestination(dest)}
                className={`map-destination-chip ${activeDestination === dest.name ? 'active' : ''}`}
                title={`Explore ${dest.name} hotels`}
              >
                {dest.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cluster Indicator Pill when zoomed out */}
      {shouldCluster && (
        <div className="map-cluster-indicator" onClick={() => mapInstanceRef.current?.zoomIn()}>
          <Layers size={14} />
          <span>{hotels.length} Stays &bull; Zoom in to explore individual properties</span>
        </div>
      )}

      {/* Mapbox WebGL Viewport Canvas */}
      <div ref={mapContainerRef} className="map-viewport" />

      {/* Explicit User Geolocation Button ("Use my location") */}
      <button
        onClick={handleLocateUser}
        title="Use my location"
        aria-label="Use my location"
        className="map-locate-btn"
      >
        <Navigation size={18} className={userLocationLoading ? 'spin' : ''} />
      </button>

      {/* Empty State Overlay */}
      {hotels.length === 0 && mapLoaded && (
        <div className="map-empty-overlay">
          <MapPin size={24} color="var(--color-text-muted)" />
          <p>No accommodations found in this area</p>
        </div>
      )}
    </div>
  );
};

export default MapView;

