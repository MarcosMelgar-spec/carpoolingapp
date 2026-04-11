export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  rating: number;
  trips_as_driver: number;
  trips_as_passenger: number;
  created_at: string;
}

export type TripStatus = "active" | "full" | "cancelled" | "completed";

export interface Trip {
  id: string;
  driver_id: string;
  driver?: Profile;
  origin: string;
  origin_lat: number;
  origin_lng: number;
  destination: string;
  destination_lat: number;
  destination_lng: number;
  departure_at: string;
  available_seats: number;
  price_per_seat: number;
  description?: string;
  status: TripStatus;
  created_at: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: string;
  trip_id: string;
  trip?: Trip;
  passenger_id: string;
  passenger?: Profile;
  seats: number;
  status: BookingStatus;
  created_at: string;
}
