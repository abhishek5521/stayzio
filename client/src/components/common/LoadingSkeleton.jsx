import React from 'react';

export const HotelCardSkeleton = () => (
  <div className="card" style={{ overflow: 'hidden' }}>
    <div className="skeleton" style={{ width: '100%', aspectRatio: '16 / 10' }}></div>
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div className="skeleton" style={{ width: '40%', height: '14px' }}></div>
      <div className="skeleton" style={{ width: '80%', height: '22px' }}></div>
      <div className="skeleton" style={{ width: '30%', height: '16px' }}></div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div className="skeleton" style={{ width: '60px', height: '20px' }}></div>
        <div className="skeleton" style={{ width: '70px', height: '20px' }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
        <div className="skeleton" style={{ width: '80px', height: '24px' }}></div>
        <div className="skeleton" style={{ width: '90px', height: '32px', borderRadius: 'var(--radius-md)' }}></div>
      </div>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
    {[...Array(count)].map((_, i) => (
      <HotelCardSkeleton key={i} />
    ))}
  </div>
);

export default HotelCardSkeleton;
