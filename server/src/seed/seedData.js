/**
 * Realistic seed data for Stayzio Hotel Booking Platform
 */

const usersData = [
  {
    name: 'Alexander Wright (Admin)',
    email: 'admin@stayzio.com',
    password: 'Admin@123456',
    phone: '+1 (555) 019-2831',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80'
  },
  {
    name: 'Emma Watson',
    email: 'emma.watson@example.com',
    password: 'Password123!',
    phone: '+1 (555) 234-5678',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'
  },
  {
    name: 'Liam Smith',
    email: 'liam.smith@example.com',
    password: 'Password123!',
    phone: '+1 (555) 345-6789',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
  },
  {
    name: 'Sophia Rodriguez',
    email: 'sophia.rodriguez@example.com',
    password: 'Password123!',
    phone: '+1 (555) 456-7890',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    password: 'Password123!',
    phone: '+1 (555) 567-8901',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
  },
  {
    name: 'Olivia Chen',
    email: 'olivia.chen@example.com',
    password: 'Password123!',
    phone: '+1 (555) 678-9012',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80'
  }
];

const hotelsData = [
  {
    name: 'The Manhattan Grand Hotel & Towers',
    description: 'Immerse yourself in world-class Manhattan sophistication. Situated in midtown near Broadway and Central Park, featuring Michelin-star dining, an opulent skyline spa, and breathtaking panoramic views of the Empire State Building.',
    address: '150 W 48th St',
    city: 'New York',
    country: 'United States',
    latitude: 40.7592,
    longitude: -73.9842,
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'hotel',
    priceFrom: 18500,
    featured: true,
    amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Fitness Center', 'Fine Dining Restaurant', 'Cocktail Lounge', 'Valet Parking', 'Concierge Service', 'Room Service']
  },
  {
    name: 'Hudson Yards Waterfront Suites',
    description: 'Ultra-modern urban sanctuary offering bespoke floor-to-ceiling riverfront vistas. Steps away from the High Line, featuring minimalist architectural elegance and smart home tech in every room.',
    address: '500 W 33rd St',
    city: 'New York',
    country: 'United States',
    latitude: 40.7549,
    longitude: -74.0018,
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'boutique',
    priceFrom: 14500,
    featured: true,
    amenities: ['Free WiFi', 'Fitness Center', 'Rooftop Bar', 'Room Service', 'Pet Friendly', 'EV Charging']
  },
  {
    name: 'Le Grand Palais Hotel & Spa',
    description: 'Quintessential Parisian grandeur overlooking the Champs-Élysées. Boasts classical French neoclassical architecture, private marble hammam, gilded chandeliers, and personalized sommelier tastings.',
    address: '12 Avenue Montaigne',
    city: 'Paris',
    country: 'France',
    latitude: 48.8661,
    longitude: 2.3082,
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'hotel',
    priceFrom: 24500,
    featured: true,
    amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Fine Dining Restaurant', 'Limousine Service', 'Breakfast Included', 'Room Service']
  },
  {
    name: 'Montmartre Artiste Retreat',
    description: 'Charming romantic boutique hotel tucked away on the cobbled slopes of bohemian Montmartre. Walking distance to Sacré-Cœur with private courtyards, artisan bakery breakfast, and vintage wine bar.',
    address: '23 Rue des Abbesses',
    city: 'Paris',
    country: 'France',
    latitude: 48.8858,
    longitude: 2.3364,
    images: [
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'boutique',
    priceFrom: 8500,
    featured: false,
    amenities: ['Free WiFi', 'Breakfast Included', 'Wine Bar', 'Room Service', 'Garden Courtyard']
  },
  {
    name: 'Shinjuku Skyline Haven',
    description: 'Futuristic tower towering high above neon-drenched Shinjuku. Offering serene Japanese minimalism, deep onsen soaking tubs, Michelin-starred sushi bar, and express direct access to Shinjuku Station.',
    address: '2-8-1 Nishi-Shinjuku',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.6905,
    longitude: 139.6921,
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'hotel',
    priceFrom: 16500,
    featured: true,
    amenities: ['Free WiFi', 'Onsen Hot Spring', 'Spa & Wellness', 'Fitness Center', 'Sushi Bar', 'Sky Lounge', 'Airport Shuttle']
  },
  {
    name: 'Tokyo Bay Waterfront Sanctuary',
    description: 'Tranquil seaside retreat nestled on Tokyo Bay featuring unobstructed views of the Rainbow Bridge and Tokyo Tower. Renowned for its infinity pool and serene Japanese rock garden.',
    address: '1-9-1 Daiba, Minato-ku',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.6288,
    longitude: 139.7712,
    images: [
      'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'resort',
    priceFrom: 13500,
    featured: false,
    amenities: ['Free WiFi', 'Swimming Pool', 'Waterfront View', 'Fitness Center', 'Restaurant', 'Cocktail Lounge']
  },
  {
    name: 'The Mayfair Heritage Hotel',
    description: 'Aristocratic British elegance situated in prestigious Mayfair. Classic wood-paneled study lounges, legendary Royal English afternoon tea service, bespoke butler service, and private cigar terrace.',
    address: '38 Stratton St',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1444,
    images: [
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'hotel',
    priceFrom: 21500,
    featured: true,
    amenities: ['Free WiFi', 'Fine Dining Restaurant', 'Afternoon Tea', 'Butler Service', 'Fitness Center', 'Valet Parking', 'Concierge Service']
  },
  {
    name: 'Thames Riverview Executive Suites',
    description: 'Sleek glass-fronted luxury suites located immediately south of London Bridge with unmatched postcard views of St. Paul’s Cathedral and the Shard. Ideal for extended business and leisure getaways.',
    address: '20 Southwark Bridge Rd',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5065,
    longitude: -0.0965,
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'apartment',
    priceFrom: 11500,
    featured: false,
    amenities: ['Free WiFi', 'Full Kitchen', 'River View', 'Fitness Center', 'Laundry Service', 'Pet Friendly']
  },
  {
    name: 'Ubud Tropical Rainforest Sanctuary',
    description: 'Enchanting jungle hideaway perched above the sacred Ayung River valley. Features bamboo eco-villas, cascading infinity pools immersed in lush canopies, daily yoga pavilions, and Balinese holistic spa therapy.',
    address: 'Jalan Raya Kedewatan',
    city: 'Bali',
    country: 'Indonesia',
    latitude: -8.4872,
    longitude: 115.2415,
    images: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'resort',
    priceFrom: 9500,
    featured: true,
    amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Yoga Pavilion', 'Organic Restaurant', 'Airport Shuttle', 'Breakfast Included']
  },
  {
    name: 'Seminyak Beachfront Sunset Resort',
    description: 'Lively coastal oasis located directly on golden Seminyak beach. Sunset beach club with live chillout DJ sets, direct surfboard access, swim-up cocktail bar, and private plunge pool villas.',
    address: 'Jl. Petitenget No. 51B',
    city: 'Bali',
    country: 'Indonesia',
    latitude: -8.6834,
    longitude: 115.1539,
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
    ],
    hotelType: 'resort',
    priceFrom: 11000,
    featured: true,
    amenities: ['Free WiFi', 'Beachfront', 'Swimming Pool', 'Beach Club', 'Spa & Wellness', 'Cocktail Bar', 'Room Service']
  }
];

const generateRoomsForHotel = (hotelId, basePrice) => [
  {
    hotel: hotelId,
    name: 'Deluxe King Room',
    description: 'Spacious signature guestroom featuring a plush California King bed, marble en-suite bathroom with deep soaking tub, and floor-to-ceiling city/nature vistas.',
    roomType: 'deluxe',
    pricePerNight: basePrice,
    capacity: { adults: 2, children: 1, totalGuests: 3 },
    beds: { count: 1, type: 'King Bed' },
    amenities: ['King Bed', 'Ensuite Marble Bath', 'High-Speed Wi-Fi', 'Smart 55" 4K TV', 'Espresso Machine', 'Mini Bar', 'Climate Control'],
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    ],
    totalRooms: 8
  },
  {
    hotel: hotelId,
    name: 'Executive Skyline Suite',
    description: 'Expansive private suite offering a separate designer living room, executive work desk, walk-in rain shower, and complimentary access to the private executive lounge.',
    roomType: 'suite',
    pricePerNight: Math.round(basePrice * 1.5),
    capacity: { adults: 2, children: 2, totalGuests: 4 },
    beds: { count: 1, type: 'Super King Bed' },
    amenities: ['Super King Bed', 'Living Room', 'Balcony', 'Executive Lounge Access', 'Bathtub', 'High-Speed Wi-Fi', 'Espresso Machine'],
    images: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
    ],
    totalRooms: 4
  },
  {
    hotel: hotelId,
    name: 'Family Twin Suite',
    description: 'Thoughtfully designed family sanctuary with two Queen beds, dual vanities, dedicated dining nook, and children’s welcome amenities.',
    roomType: 'family',
    pricePerNight: Math.round(basePrice * 1.3),
    capacity: { adults: 2, children: 2, totalGuests: 4 },
    beds: { count: 2, type: 'Queen Beds' },
    amenities: ['2 Queen Beds', 'Dining Table', 'Bathtub', 'Smart TV', 'Mini Bar', 'High-Speed Wi-Fi', 'Complimentary Crib upon request'],
    images: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
    ],
    totalRooms: 5
  },
  {
    hotel: hotelId,
    name: 'Presidential Penthouse',
    description: 'The pinnacle of luxury hospitality. Top-floor penthouse featuring 360-degree panoramic terrace, private Jacuzzi, dining room for 8, and dedicated 24-hour butler service.',
    roomType: 'penthouse',
    pricePerNight: Math.round(basePrice * 2.6),
    capacity: { adults: 4, children: 2, totalGuests: 6 },
    beds: { count: 2, type: 'King Beds' },
    amenities: ['Private Jacuzzi', 'Terrace', 'Butler Service', 'Chef Kitchen', 'Wine Cellar', 'Panoramic Views', 'Limousine Transfer'],
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'
    ],
    totalRooms: 2
  }
];

const sampleReviewsData = [
  {
    rating: 5,
    comment: 'Absolutely extraordinary experience! The check-in was seamless, the room views were breathtaking, and the concierge booked us into impossible dinner reservations.'
  },
  {
    rating: 5,
    comment: 'Unsurpassed hospitality and stunning architectural details. The breakfast spread was divine and the bedding felt like sleeping on a cloud. Will definitely return.'
  },
  {
    rating: 4,
    comment: 'Exceptional stay. The location is impossible to beat, close to iconic sights and great cafes. The spa was rejuvenating. Highly recommend for couples or business travelers.'
  },
  {
    rating: 5,
    comment: 'From the moment we arrived until checkout, every single staff member went above and beyond. Clean, luxurious, and beautifully maintained.'
  }
];

module.exports = {
  usersData,
  hotelsData,
  generateRoomsForHotel,
  sampleReviewsData
};
