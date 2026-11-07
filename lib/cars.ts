import { cacheLife } from "next/cache";
import { supabase } from "./supabase";

export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  city: string;
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  min_rental_days: number;
  images: string[] | null;
  features: string[] | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
};

const COLUMNS = "id, make, model, year, price_per_day, city, category, transmission, fuel, seats, min_rental_days, images, features, rating, review_count, created_at";

// Cars are added and approved in the browser, so the server cannot be told when the list changes: it re-reads it often
const FRESH = { stale: 30, revalidate: 30, expire: 600 };

/** A car with no minimum set rents from 1 day. */
const withMin = (rows: unknown): Car[] => ((rows ?? []) as Car[]).map((car) => ({ ...car, min_rental_days: car.min_rental_days ?? 1 }));

/** Available cars (newest first). Refreshed every half minute. */
export async function getCars(options: { limit?: number } = {}): Promise<Car[]> {
  "use cache";
  cacheLife(FRESH);

  let query = supabase.from("cars").select(COLUMNS).eq("is_available", true).order("created_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) {
    console.error("[cars] could not load cars:", error.message);
    return [];
  }
  return withMin(data);
}

export async function getCar(id: string): Promise<Car | null> {
  "use cache";
  cacheLife(FRESH);

  const { data } = await supabase.from("cars").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? withMin([data])[0] : null;
}
