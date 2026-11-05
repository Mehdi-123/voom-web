export type BookingStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled" | "no_show";

export type BookingRow = {
  id: string;
  car_id: string;
  customer_id: string;
  date_from: string;
  date_to: string;
  total_days: number;
  price_per_day: number;
  service_fee: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  customer: { name: string | null } | null;
  car: { make: string; model: string; year: number; images: string[] | null } | null;
};

/** The columns the agency pages read; the same shape the app's agency screens use. */
export const BOOKING_SELECT = "id, car_id, customer_id, date_from, date_to, total_days, price_per_day, service_fee, total_price, status, created_at, customer:profiles!customer_id(name), car:cars!car_id(make, model, year, images)";

export type CarRow = {
  id: string;
  agency_id: string;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  city: string;
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  images: string[] | null;
  features: string[] | null;
  is_available: boolean;
  rating?: number | null;
  review_count?: number | null;
};
