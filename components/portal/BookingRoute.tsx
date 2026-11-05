"use client";

import { useAuth } from "./AuthProvider";
import BookingDetail from "./BookingDetail";
import CustomerBookingDetail from "./CustomerBookingDetail";

/** The same address shows an agency its booking, or a renter theirs. */
export default function BookingRoute() {
  const { role } = useAuth();
  return role === "customer" ? <CustomerBookingDetail /> : <BookingDetail />;
}
