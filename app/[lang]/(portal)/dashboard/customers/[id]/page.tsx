import { Suspense } from "react";
import CustomerProfile from "@/components/portal/CustomerProfile";
import { Loading } from "@/components/portal/dash-ui";

export default function Page() {
  return <Suspense fallback={<Loading />}><CustomerProfile /></Suspense>;
}
