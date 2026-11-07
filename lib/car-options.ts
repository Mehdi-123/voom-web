/** Extras an agency can tick on a car. Stored as these labels in cars.features, exactly as the app does. */
export const CAR_OPTIONS = [
  "GPS", "USB charger", "Bluetooth", "360° camera", "Apple CarPlay / Android Auto", "Air conditioning",
  "Parking sensors", "Reversing camera", "Dashcam", "Child seat", "Sunroof", "Cruise control",
  "Unlimited mileage", "Wi-Fi hotspot", "Roof rack",
] as const;

export const CATEGORIES = ["economy", "comfort", "luxury", "suv", "van"] as const;
export const TRANSMISSIONS = ["manual", "automatic"] as const;
export const FUELS = ["petrol", "diesel", "electric", "hybrid"] as const;
export const SEATS = [2, 4, 5, 7, 9] as const;
/** The longest minimum rental an agency can ask for, in days (the database enforces the same range). */
export const MAX_MIN_RENTAL_DAYS = 30;
