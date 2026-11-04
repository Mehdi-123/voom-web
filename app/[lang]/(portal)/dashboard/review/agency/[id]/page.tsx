import { Suspense } from "react";
import ReviewDetail from "@/components/portal/ReviewDetail";
import { Loading } from "@/components/portal/dash-ui";

export default function Page() {
  return <Suspense fallback={<Loading />}><ReviewDetail kind="agency" /></Suspense>;
}
