"use client";

import { useAuth } from "@/components/portal/AuthProvider";
import AgencyProfile from "@/components/portal/AgencyProfile";
import MyProfile from "@/components/portal/MyProfile";

export default function ProfileRoute() {
  const { role } = useAuth();
  return role === "customer" ? <MyProfile /> : <AgencyProfile />;
}
