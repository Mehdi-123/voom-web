import { Suspense } from "react";
import BookingRoute from "@/components/portal/BookingRoute";
import { Loading } from "@/components/portal/dash-ui";

export default function Page() {
  return <Suspense fallback={<Loading />}><BookingRoute /></Suspense>;
}
