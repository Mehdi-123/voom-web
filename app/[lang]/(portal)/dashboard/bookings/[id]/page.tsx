import { Suspense } from "react";
import BookingDetail from "@/components/portal/BookingDetail";
import { Loading } from "@/components/portal/dash-ui";

export default function Page() {
  return <Suspense fallback={<Loading />}><BookingDetail /></Suspense>;
}
