import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, List, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import HotelCard from '../../components/hotel/HotelCard';
import HotelFilters from '../../components/hotel/HotelFilters';
import MapView from '../../components/map/MapView';
import MapModal from '../../components/map/MapModal';
import { HotelCardSkeleton } from '../../components/common/LoadingSkeleton';

const HotelSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const destinationParam = searchParams.get('destination') || '';
  const checkInParam = searchParams.get('checkIn') || '';
  const checkOutParam = searchParams.get('checkOut') || '';
  const guestsParam = searchParams.get('guests') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const ratingParam = searchParams.get('rating') || '';
  const sortParam = searchParams.get('sort') || 'recommended';

  // Filters State
  const [filters, setFilters] = useState({
    destination: destinationParam,
    checkIn: checkInParam,
    checkOut: checkOutParam,
    guests: guestsParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    rating: ratingParam,
    hotelType: searchParams.getAll('hotelType'),
    amenities: searchParams.getAll('amenities'),
    sort: sortParam,
    page: 1
  });

  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Map Synchronization State
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [hoveredHotelId, setHoveredHotelId] = useState(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  // Fetch hotels with current filters
  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      const query = {
        ...filters,
        hotelType: filters.hotelType?.length ? filters.hotelType.join(',') : undefined,
        amenities: filters.amenities?.length ? filters.amenities.join(',') : undefined
      };

      // Clean empty keys
      Object.keys(query).forEach((k) => {
        if (!query[k]) delete query[k];
      });

      const res = await hotelService.getHotels(query);
      if (res.success) {
        setHotels(res.data.hotels || []);
        setPagination(res.data.pagination || { total: 0, page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching hotels:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      destination: '',
      checkIn: '',
      checkOut: '',
      guests: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      hotelType: [],
      amenities: [],
      sort: 'recommended',
      page: 1
    });
    setSearchParams({});
  };

  return (
    <div className="container">
      {/* Header Results Summary & Sorting */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2rem 0 1rem 0',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            {filters.destination ? `Stays in "${filters.destination}"` : 'All Accommodations'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Showing {hotels.length} of {pagination.total} luxury properties
            {filters.checkIn && filters.checkOut ? ` for ${filters.checkIn} to ${filters.checkOut}` : ''}
          </p>
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            <ArrowUpDown size={15} color="var(--color-text-muted)" />
            <span style={{ fontWeight: 600 }}>Sort by:</span>
          </div>
          <select
            className="form-select"
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            style={{ padding: '0.45rem 1rem', fontSize: '0.88rem', width: 'auto' }}
          >
            <option value="recommended">Recommended & Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Main 3-Pane Search Layout: Filters | List | Map */}
      <div className="search-layout">
        {/* LEFT: Filters Sidebar */}
        <HotelFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* CENTER: Results List */}
        <main>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[...Array(4)].map((_, i) => (
                <HotelCardSkeleton key={i} />
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}
              >
                <SlidersHorizontal size={24} />
              </div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>No properties matched your search</h3>
              <p style={{ maxWidth: '400px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Try adjusting your price range, selected dates, or clear your amenity filters to view more accommodations.
              </p>
              <button onClick={handleResetFilters} className="btn btn-secondary">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {hotels.map((hotel) => (
                <HotelCard
                  key={hotel._id}
                  hotel={hotel}
                  isActive={selectedHotelId === hotel._id}
                  onMouseEnter={(id) => setHoveredHotelId(id)}
                  onMouseLeave={() => setHoveredHotelId(null)}
                />
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handleFilterChange('page', i + 1)}
                      className={`btn btn-sm ${
                        pagination.page === i + 1 ? 'btn-primary' : 'btn-secondary'
                      }`}
                      style={{ width: '38px', height: '38px' }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* RIGHT: Interactive Map Pane (Desktop) */}
        <div className="search-map-pane">
          <MapView
            hotels={hotels}
            selectedHotelId={selectedHotelId}
            hoveredHotelId={hoveredHotelId}
            onMarkerClick={(hotel) => setSelectedHotelId(hotel._id)}
            onDestinationSelect={(dest) => handleFilterChange('destination', dest)}
          />
        </div>
      </div>

      {/* Floating Action Button for Mobile: Toggle Map Modal */}
      <button
        className="mobile-map-toggle-btn"
        onClick={() => setMobileMapOpen(true)}
        aria-label="View properties on interactive map"
      >
        <Map size={18} />
        <span>View on Map ({hotels.length})</span>
      </button>

      {/* Mobile Map Modal */}
      <MapModal
        isOpen={mobileMapOpen}
        onClose={() => setMobileMapOpen(false)}
        hotels={hotels}
        selectedHotelId={selectedHotelId}
        onMarkerClick={(hotel) => setSelectedHotelId(hotel._id)}
      />
    </div>
  );
};

export default HotelSearch;
