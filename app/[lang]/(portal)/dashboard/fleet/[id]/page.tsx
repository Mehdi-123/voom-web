import { Suspense } from "react";
import CarForm from "@/components/portal/CarForm";
import { Loading } from "@/components/portal/dash-ui";

export default function Page() {
  return <Suspense fallback={<Loading />}><CarForm /></Suspense>;
}
