export type Amenity =
  | 'AC'
  | 'Hot water'
  | 'WiFi'
  | 'Hair dryer'
  | 'Iron'
  | 'Kettle'
  | 'Microwave'
  | 'TV'
  | 'Desk'
  | 'Chair'
  | 'Private bathroom'
  | 'Non-smoking'
  | 'Self check-in'
  | 'Washing machine';

export type RoomType = 'Standard Double' | 'Superior Double' | 'Deluxe Double';

export interface Room {
  id:            string;
  roomNumber:    string;
  nameVi:        string;
  nameEn:        string;
  type:          RoomType;
  maxGuests:     number;
  pricePerNight: number;
  sizeSqm:       number;
  bed:           string;
  amenities:     Amenity[];
  description:   string;
  /** True = not yet built / coming soon; hidden from the public site by default */
  isPlaceholder?: boolean;
}

/** Standard amenity set shared by all rooms */
const STANDARD_AMENITIES: Amenity[] = [
  'AC', 'Hot water', 'WiFi',
  'Hair dryer', 'Iron', 'Kettle', 'Microwave', 'TV',
  'Desk', 'Chair', 'Private bathroom',
  'Non-smoking', 'Self check-in',
  'Washing machine',
];

const PLACEHOLDER_DESC =
  'This room is currently under construction. Details will be updated once it is ready to welcome guests.';

export const rooms: Room[] = [
  // ── Active rooms ────────────────────────────────────────────────────────────
  {
    id: 'green-mountain',
    roomNumber: '101',
    nameVi: 'Delta',
    nameEn: 'Delta',
    type: 'Standard Double',
    maxGuests: 2,
    pricePerNight: 500_000,
    sizeSqm: 26,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description:
      'The most private and convenient room at Hoang Long. A cozy 26 m² retreat packed with everything you need — perfect for solo travellers or couples seeking calm and simplicity.',
  },
  {
    id: 'ban-flower',
    roomNumber: '201',
    nameVi: 'Gamma',
    nameEn: 'Gamma',
    type: 'Superior Double',
    maxGuests: 2,
    pricePerNight: 650_000,
    sizeSqm: 35,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description:
      'The best street view in the house, with a massive private balcony. At 35 m², this bright room is perfect for guests who love watching the neighbourhood come alive.',
  },
  {
    id: 'family-room',
    roomNumber: '202',
    nameVi: 'Alpha',
    nameEn: 'Alpha',
    type: 'Deluxe Double',
    maxGuests: 2,
    pricePerNight: 900_000,
    sizeSqm: 45,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description:
      'One of our most spacious rooms at 45 m², with three large windows flooding the space with natural light and a private balcony. A favourite for extended-stay professionals.',
  },
  {
    id: 'deluxe',
    roomNumber: '301',
    nameVi: 'Beta',
    nameEn: 'Beta',
    type: 'Deluxe Double',
    maxGuests: 2,
    pricePerNight: 900_000,
    sizeSqm: 45,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description:
      'Our signature room. Three panoramic windows and a private balcony deliver light, space, and fresh air in abundance — the ultimate choice for a premium long-stay experience.',
  },

  // ── Placeholder rooms (coming soon) ─────────────────────────────────────────
  {
    id: 'epsilon',
    roomNumber: '102',
    nameVi: 'Epsilon',
    nameEn: 'Epsilon',
    type: 'Standard Double',
    maxGuests: 2,
    pricePerNight: 500_000,
    sizeSqm: 26,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
  {
    id: 'zeta',
    roomNumber: '203',
    nameVi: 'Zeta',
    nameEn: 'Zeta',
    type: 'Superior Double',
    maxGuests: 2,
    pricePerNight: 650_000,
    sizeSqm: 35,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
  {
    id: 'eta',
    roomNumber: '204',
    nameVi: 'Eta',
    nameEn: 'Eta',
    type: 'Superior Double',
    maxGuests: 2,
    pricePerNight: 650_000,
    sizeSqm: 35,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
  {
    id: 'theta',
    roomNumber: '302',
    nameVi: 'Theta',
    nameEn: 'Theta',
    type: 'Deluxe Double',
    maxGuests: 2,
    pricePerNight: 900_000,
    sizeSqm: 45,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
  {
    id: 'iota',
    roomNumber: '303',
    nameVi: 'Iota',
    nameEn: 'Iota',
    type: 'Deluxe Double',
    maxGuests: 2,
    pricePerNight: 900_000,
    sizeSqm: 45,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
  {
    id: 'kappa',
    roomNumber: '304',
    nameVi: 'Kappa',
    nameEn: 'Kappa',
    type: 'Deluxe Double',
    maxGuests: 2,
    pricePerNight: 900_000,
    sizeSqm: 45,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
  {
    id: 'lambda',
    roomNumber: '103',
    nameVi: 'Lambda',
    nameEn: 'Lambda',
    type: 'Standard Double',
    maxGuests: 2,
    pricePerNight: 500_000,
    sizeSqm: 26,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
  {
    id: 'omicron',
    roomNumber: '205',
    nameVi: 'Omicron',
    nameEn: 'Omicron',
    type: 'Superior Double',
    maxGuests: 2,
    pricePerNight: 650_000,
    sizeSqm: 35,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
  {
    id: 'sigma',
    roomNumber: '206',
    nameVi: 'Sigma',
    nameEn: 'Sigma',
    type: 'Superior Double',
    maxGuests: 2,
    pricePerNight: 650_000,
    sizeSqm: 35,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
  {
    id: 'omega',
    roomNumber: '305',
    nameVi: 'Omega',
    nameEn: 'Omega',
    type: 'Deluxe Double',
    maxGuests: 2,
    pricePerNight: 900_000,
    sizeSqm: 45,
    bed: '1 Queen bed',
    amenities: STANDARD_AMENITIES,
    description: PLACEHOLDER_DESC,
    isPlaceholder: true,
  },
];

/** Rooms that are visible on the public site (non-placeholder baseline). */
export const activeRooms = rooms.filter((r) => !r.isPlaceholder);

export function getRoomById(id: string): Room | undefined {
  return rooms.find((r) => r.id === id);
}
