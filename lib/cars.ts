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
  images: string[] | null;
  features: string[] | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
};

const COLUMNS = "id, make, model, year, price_per_day, city, category, transmission, fuel, seats, images, features, rating, review_count, created_at";

/** Available cars (newest first), optionally for one city. Refreshed about every hour. */
export async function getCars(options: { limit?: number } = {}): Promise<Car[]> {
  "use cache";
  cacheLife("hours");

  let query = supabase.from("cars").select(COLUMNS).eq("is_available", true).order("created_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) {
    console.error("[cars] could not load cars:", error.message);
    return [];
  }
  return (data ?? []) as Car[];
}

export async function getCar(id: string): Promise<Car | null> {
  "use cache";
  cacheLife("hours");

  const { data } = await supabase.from("cars").select(COLUMNS).eq("id", id).maybeSingle();
  return (data as Car | null) ?? null;
}
