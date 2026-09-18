import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  AlertTriangle,
  Search,
  Layers,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { formatINR } from '../../utils/currency';

// Read MapTiler API Key from Vite environment (Strictly non-hardcoded)
const MAPTILER_API_KEY = (import.meta.env.VITE_MAPTILER_API_KEY || '').trim();

// MapTiler Streets v2 raster tiles endpoint
const getMapTilerTileUrl = (key) =>
  `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`;

const MAPTILER_ATTRIBUTION =
  '&copy; <a href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>';

// Destination quick-jump presets [lat, lng]
const DESTINATION_PRESETS = [
  { name: 'Tokyo', center: [35.6905, 139.6921], zoom: 12 },
  { name: 'New York', center: [40.7592, -73.9842], zoom: 12 },
  { name: 'Paris', center: [48.8661, 2.3082], zoom: 12 },
  { name: 'London', center: [51.5074, -0.1444], zoom: 12 },
  { name: 'Bali', center: [-8.4872, 115.2415], zoom: 11 }
];

// Helper: Safely extract and validate hotel coordinates [lat, lng]
const getHotelCoordinates = (hotel) => {
  if (!hotel) return null;

  let lat = hotel.latitude;
  let lng = hotel.longitude;

  // Fallback to GeoJSON Point coordinates: [longitude, latitude]
  if ((lat === undefined || lat === null) && Array.isArray(hotel.location?.coordinates)) {
    lng = hotel.location.coordinates[0];
    lat = hotel.location.coordinates[1];
  }

  lat = typeof lat === 'string' ? parseFloat(lat) : lat;
  lng = typeof lng === 'string' ? parseFloat(lng) : lng;

  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    (lat !== 0 || lng !== 0) // Treat [0, 0] null island as invalid for hotel addresses
  ) {
    return [lat, lng];
  }

  return null;
};

// Helper: Safely extract and validate current map zoom level
const getSafeZoom = (map, fallback = 12) => {
  if (!map) return fallback;
  try {
    const z = map.getZoom();
    return typeof z === 'number' && !isNaN(z) ? z : fallback;
  } catch (e) {
    return fallback;
  }
};

// Helper: Safely transition camera preventing NaN LatLng crashes when container has 0 dimensions
const safeFlyTo = (map, coords, targetZoom, options = { duration: 0.6 }) => {
  if (!map || !coords) return;
  try {
    const size = typeof map.getSize === 'function' ? map.getSize() : null;
    if (!size || size.x <= 0 || size.y <= 0) {
      map.setView(coords, targetZoom);
      return;
    }
    map.flyTo(coords, targetZoom, options);
  } catch (e) {
    try {
      map.setView(coords, targetZoom);
    } catch (err) {}
  }
};

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
  const userMarkerRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [activeDestination, setActiveDestination] = useState('');
  const [userLocationLoading, setUserLocationLoading] = useState(false);

  // Filter hotels that have strictly valid coordinates
  const validHotels = useMemo(() => {
    if (!Array.isArray(hotels)) return [];
    return hotels.filter((h) => getHotelCoordinates(h) !== null);
  }, [hotels]);

  // Clustering / Regional density indicator when zoomed out
  const shouldCluster = useMemo(() => {
    return validHotels.length >= 6 && currentZoom < 10;
  }, [validHotels.length, currentZoom]);

  // 1. Initialize Leaflet Map with MapTiler Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if MapTiler API Key is present
    if (!MAPTILER_API_KEY) {
      setHasError(true);
      setLoading(false);
      return;
    }

    // Defensive cleanup of any stale Leaflet instance on the container
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    try {
      // Determine initial center [lat, lng]
      let initialCenter = [40.7592, -73.9842]; // Default New York
      if (center && Array.isArray(center) && center.length === 2) {
        // Support either [lng, lat] coordinate format or standard [lat, lng]
        if (Math.abs(center[0]) <= 90 && Math.abs(center[1]) <= 180) {
          initialCenter = [center[0], center[1]];
        } else {
          initialCenter = [center[1], center[0]];
        }
      } else if (validHotels.length > 0) {
        const coords = getHotelCoordinates(validHotels[0]);
        if (coords) initialCenter = coords;
      }

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: zoom,
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        attributionControl: true
      });

      // Add MapTiler Streets v2 TileLayer
      const tileLayer = L.tileLayer(getMapTilerTileUrl(MAPTILER_API_KEY), {
        attribution: MAPTILER_ATTRIBUTION,
        maxZoom: 19,
        minZoom: 2,
        crossOrigin: true
      });

      tileLayer.on('tileerror', (err) => {
        console.warn('MapTiler tile loading issue:', err);
      });

      tileLayer.addTo(map);

      // Track zoom level for density indicator and responsive markers
      map.on('zoomend', () => {
        setCurrentZoom(getSafeZoom(map, zoom));
      });

      mapInstanceRef.current = map;
      setMapReady(true);
      setLoading(false);

      // Invalidate size once tiles load / container settles
      const t1 = setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 100);
      const t2 = setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 350);

      // ResizeObserver for responsive flex / modal resizing
      let resizeObserver = null;
      if (window.ResizeObserver && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        if (resizeObserver) resizeObserver.disconnect();
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
          userMarkerRef.current = null;
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
          delete mapContainerRef.current._leaflet_id;
        }
        setMapReady(false);
      };
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setHasError(true);
      setLoading(false);
    }
  }, [interactive]);

  // 2. Render & Synchronize Hotel Markers and Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    if (validHotels.length === 0) return;

    const bounds = L.latLngBounds([]);

    validHotels.forEach((hotel) => {
      const coords = getHotelCoordinates(hotel);
      if (!coords) return;

      bounds.extend(coords);

      const priceFormatted = formatINR(hotel.priceFrom);
      const isSelected = selectedHotelId === hotel._id;
      const isHovered = hoveredHotelId === hotel._id;

      // Custom Leaflet DivIcon for luxury INR Price Pill
      const icon = L.divIcon({
        className: 'stayzio-leaflet-marker-icon',
        html: `
          <div id="map-marker-${hotel._id}" class="stayzio-price-marker ${
            isSelected ? 'active' : isHovered ? 'hovered' : ''
          }" title="${hotel.name}">
            <span>${priceFormatted}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker(coords, { icon: icon, riseOnHover: true });

      // Rich luxury popup card
      const popupHtml = `
        <div class="map-popup-card">
          <img
            src="${hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}"
            alt="${hotel.name}"
            class="map-popup-image"
          />
          <div class="map-popup-body">
            <div class="map-popup-title">${hotel.name}</div>
            <div class="map-popup-rating">
              <span class="star">★</span>
              <span class="score">${hotel.rating > 0 ? hotel.rating.toFixed(1) : 'New'}</span>
              <span class="count">(${hotel.reviewCount || 0} reviews)</span>
            </div>
            <div class="map-popup-location">${hotel.city || ''}, ${hotel.country || ''}</div>
            <div class="map-popup-footer">
              <div>
                <span class="map-popup-price">${priceFormatted}</span>
                <span class="map-popup-night"> / night</span>
              </div>
              <a href="/hotels/${hotel._id}" class="map-popup-link">View Hotel &rarr;</a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        minWidth: 260,
        offset: [0, -12],
        closeButton: true
      });

      // Marker Click: Select hotel, open popup, scroll card into view
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);

        if (onMarkerClick) {
          onMarkerClick(hotel);
        }

        // Map-to-Card scroll synchronization
        const targetCard = document.getElementById(`hotel-card-${hotel._id}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        const targetZoom = Math.max(getSafeZoom(map, 12), 13);
        safeFlyTo(map, coords, targetZoom, { duration: 0.6 });
        marker.openPopup();
      });

      marker.addTo(map);
      markersRef.current[hotel._id] = marker;
    });

    // Auto-fit bounds if multiple hotels; or center on single hotel
    if (validHotels.length > 1 && !selectedHotelId && !center) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (validHotels.length === 1 && !center) {
      const singleCoords = getHotelCoordinates(validHotels[0]);
      if (singleCoords) {
        const singleZoom = Math.max(getSafeZoom(map, 12), 14);
        map.setView(singleCoords, singleZoom);
      }
    }
  }, [mapReady, validHotels]);

  // 3. Card-to-Map Hover & Selection Synchronization
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.entries(markersRef.current).forEach(([hotelId, marker]) => {
      const el = document.getElementById(`map-marker-${hotelId}`);
      if (!el) return;

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

    // Center & open popup on selected hotel
    if (selectedHotelId && markersRef.current[selectedHotelId]) {
      const marker = markersRef.current[selectedHotelId];
      const hotel = validHotels.find((h) => h._id === selectedHotelId);
      if (hotel) {
        const coords = getHotelCoordinates(hotel);
        if (coords) {
          const targetZoom = Math.max(getSafeZoom(map, 12), 13);
          safeFlyTo(map, coords, targetZoom, { duration: 0.6 });
          marker.openPopup();
        }
      }
    }
  }, [selectedHotelId, hoveredHotelId, validHotels]);

  // 4. Destination Quick Jump Handler
  const handleJumpToDestination = (dest) => {
    setActiveDestination(dest.name);
    if (mapInstanceRef.current) {
      safeFlyTo(mapInstanceRef.current, dest.center, dest.zoom, { duration: 0.8 });
    }
    if (onDestinationSelect) {
      onDestinationSelect(dest.name);
    }
  };

  // 5. Geolocation Action Handler: "Use My Location"
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setUserLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocationLoading(false);
        const { latitude, longitude } = position.coords;

        if (mapInstanceRef.current) {
          safeFlyTo(mapInstanceRef.current, [latitude, longitude], 13, { duration: 1.0 });

          // Add or move user location marker
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          const userIcon = L.divIcon({
            className: 'stayzio-leaflet-marker-icon',
            html: '<div class="stayzio-user-location-marker" title="Your Location"></div>',
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
            .bindPopup('<strong>Your Current Location</strong>', { offset: [0, -10] })
            .addTo(mapInstanceRef.current);
        }
      },
      (error) => {
        setUserLocationLoading(false);
        console.warn('Geolocation permission or availability notice:', error.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Clean User-Friendly Error State (Zero Technical Prompts / Zero Exposed Keys)
  if (hasError) {
    return (
      <div className="map-error-container" style={{ height }}>
        <div className="map-error-card">
          <AlertTriangle size={28} color="#94a3b8" />
          <h4>Map Unavailable</h4>
          <p>Map is currently unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container" style={{ height }}>
      {/* Floating Destination Quick Jump Bar */}
      {validHotels.length > 1 && (
        <div className="map-destination-bar" role="navigation" aria-label="Quick jump destinations">
          <div className="map-destination-title">
            <Search size={13} />
            <span>Destinations:</span>
          </div>
          <div className="map-destination-chips">
            {DESTINATION_PRESETS.map((dest) => (
              <button
                key={dest.name}
                type="button"
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

      {/* Regional Cluster Indicator when zoomed out */}
      {shouldCluster && (
        <div
          className="map-cluster-indicator"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Zoom in to view individual hotels"
        >
          <Layers size={14} />
          <span>{validHotels.length} Stays &bull; Zoom in to explore properties</span>
        </div>
      )}

      {/* Leaflet Map Viewport */}
      <div ref={mapContainerRef} className="map-viewport" />

      {/* Loading Overlay */}
      {loading && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner" />
          <span>Loading map...</span>
        </div>
      )}

      {/* Geolocation Button ("Use my location") */}
      {interactive && (
        <button
          type="button"
          onClick={handleLocateUser}
          title="Use my location"
          aria-label="Use my location"
          className="map-locate-btn"
        >
          <Navigation size={18} className={userLocationLoading ? 'spin' : ''} />
        </button>
      )}

      {/* Empty State Overlay */}
      {validHotels.length === 0 && !loading && (
        <div className="map-empty-overlay">
          <MapPin size={24} color="var(--color-text-muted)" />
          <p>No accommodations found in this area</p>
        </div>
      )}
    </div>
  );
};

export default MapView;


