"use client";

import { useAuth } from "@/components/portal/AuthProvider";
import AgencyProfile from "@/components/portal/AgencyProfile";
import MyProfile from "@/components/portal/MyProfile";

export default function ProfilePage() {
  const { role } = useAuth();
  return role === "customer" ? <MyProfile /> : <AgencyProfile />;
}
