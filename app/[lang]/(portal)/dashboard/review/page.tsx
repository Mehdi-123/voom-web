import { Suspense } from "react";
import ReviewQueue from "@/components/portal/ReviewQueue";
import { Loading } from "@/components/portal/dash-ui";

export default function Page() {
  return <Suspense fallback={<Loading />}><ReviewQueue /></Suspense>;
}
