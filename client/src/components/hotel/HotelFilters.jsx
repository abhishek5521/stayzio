import React from 'react';
import { Filter, RotateCcw, Star, Check } from 'lucide-react';

const HOTEL_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'resort', label: 'Resort' },
  { value: 'boutique', label: 'Boutique Hotel' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Luxury Villa' }
];

const AMENITY_OPTIONS = [
  'Free WiFi',
  'Swimming Pool',
  'Spa & Wellness',
  'Fitness Center',
  'Fine Dining Restaurant',
  'Beachfront',
  'Room Service',
  'Breakfast Included'
];

const HotelFilters = ({ filters, onFilterChange, onResetFilters }) => {
  const handleTypeToggle = (type) => {
    let newTypes = [...(filters.hotelType || [])];
    if (newTypes.includes(type)) {
      newTypes = newTypes.filter((t) => t !== type);
    } else {
      newTypes.push(type);
    }
    onFilterChange('hotelType', newTypes);
  };

  const handleAmenityToggle = (amenity) => {
    let newAmenities = [...(filters.amenities || [])];
    if (newAmenities.includes(amenity)) {
      newAmenities = newAmenities.filter((a) => a !== amenity);
    } else {
      newAmenities.push(amenity);
    }
    onFilterChange('amenities', newAmenities);
  };

  return (
    <aside className="card search-filters-pane" style={{ padding: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
          <Filter size={18} color="var(--color-accent)" />
          <span>Filters</span>
        </div>
        <button
          onClick={onResetFilters}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            fontWeight: 600
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Price Filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <label className="form-label" style={{ margin: 0 }}>
            Price per night (₹ INR)
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            type="number"
            className="form-control"
            placeholder="Min ₹"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>-</span>
          <input
            type="number"
            className="form-control"
            placeholder="Max ₹"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* Quick INR presets */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {[
            { label: '< ₹10k', min: '', max: '10000' },
            { label: '₹10k - ₹20k', min: '10000', max: '20000' },
            { label: '₹20k+', min: '20000', max: '' }
          ].map((preset, idx) => {
            const isSelected = filters.minPrice === preset.min && filters.maxPrice === preset.max;
            return (
              <button
                key={idx}
                type="button"
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', flex: '1 1 auto' }}
                onClick={() => {
                  onFilterChange('minPrice', preset.min);
                  onFilterChange('maxPrice', preset.max);
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating Filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label className="form-label" style={{ marginBottom: '0.6rem' }}>
          Minimum Guest Rating
        </label>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { val: '', label: 'Any' },
            { val: '4.0', label: '4.0+' },
            { val: '4.5', label: '4.5+' },
            { val: '4.8', label: '4.8+' }
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => onFilterChange('rating', item.val)}
              className={`btn btn-sm ${
                (filters.rating || '') === item.val ? 'btn-primary' : 'btn-secondary'
              }`}
              style={{ flex: 1, padding: '0.4rem 0.2rem', fontSize: '0.8rem' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label className="form-label" style={{ marginBottom: '0.6rem' }}>
          Property Type
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {HOTEL_TYPES.map((type) => {
            const isChecked = filters.hotelType?.includes(type.value);
            return (
              <label
                key={type.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  color: 'var(--color-text-main)'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked || false}
                  onChange={() => handleTypeToggle(type.value)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)' }}
                />
                <span>{type.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="form-label" style={{ marginBottom: '0.6rem' }}>
          Popular Amenities
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {AMENITY_OPTIONS.map((amenity) => {
            const isChecked = filters.amenities?.includes(amenity);
            return (
              <label
                key={amenity}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  color: 'var(--color-text-main)'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked || false}
                  onChange={() => handleAmenityToggle(amenity)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)' }}
                />
                <span>{amenity}</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default HotelFilters;
