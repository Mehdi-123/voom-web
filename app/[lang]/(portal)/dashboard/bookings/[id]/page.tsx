import { Suspense } from "react";
import BookingRoute from "@/components/portal/BookingRoute";
import { Loading } from "@/components/portal/dash-ui";

// Depends on who is signed in, which only the browser knows: no instant-navigation check
export const instant = false;

export default function Page() {
  return <Suspense fallback={<Loading />}><BookingRoute /></Suspense>;
}
