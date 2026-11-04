import { cacheLife } from "next/cache";
import { supabase } from "./supabase";
import { City, cityNames } from "./cities";

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
export async function getCars(options: { city?: City; limit?: number } = {}): Promise<Car[]> {
  "use cache";
  cacheLife("hours");

  let query = supabase.from("cars").select(COLUMNS).eq("is_available", true).order("created_at", { ascending: false });
  if (options.city) query = query.in("city", cityNames(options.city));
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

/** The cities that currently have at least one car, for the sitemap and the city links. */
export async function getCitiesWithCars(): Promise<string[]> {
  "use cache";
  cacheLife("hours");

  const { data } = await supabase.from("cars").select("city").eq("is_available", true);
  return Array.from(new Set((data ?? []).map((r: { city: string }) => r.city)));
}
