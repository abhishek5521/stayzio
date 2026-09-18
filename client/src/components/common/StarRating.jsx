import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, reviewCount = null, size = 16, showNumber = true }) => {
  const roundedRating = Math.round(rating * 10) / 10;
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 >= 0.5;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-gold)' }}>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} size={size} fill="var(--color-gold)" stroke="none" />;
          } else if (i === fullStars && hasHalfStar) {
            return (
              <div key={i} style={{ position: 'relative', display: 'inline-flex' }}>
                <Star size={size} color="#cbd5e1" />
                <div style={{ position: 'absolute', overflow: 'hidden', width: '50%' }}>
                  <Star size={size} fill="var(--color-gold)" stroke="none" />
                </div>
              </div>
            );
          } else {
            return <Star key={i} size={size} color="#cbd5e1" strokeWidth={1.5} />;
          }
        })}
      </div>

      {showNumber && (
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}>
          {roundedRating.toFixed(1)}
        </span>
      )}

      {reviewCount !== null && (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

export default StarRating;
