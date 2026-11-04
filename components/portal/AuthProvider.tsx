"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { sb } from "@/lib/supabase-browser";

export type Approval = "pending" | "approved" | "rejected";
export type Agency = {
  id: string;
  name: string;
  city: string;
  phone: string | null;
  email: string | null;
  registration_number: string | null;
  approval_status: Approval;
  rejection_reason: string | null;
};

type AuthState = {
  /** False until we know whether someone is signed in. */
  ready: boolean;
  user: User | null;
  /** "admin" comes from the admins table; the sign-up choice decides agency or customer. */
  role: "admin" | "agency" | "customer" | null;
  agency: Agency | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Keeps track of who is signed in and, for agencies, their agency row and approval status. */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, "refresh" | "signOut">>({ ready: false, user: null, role: null, agency: null });

  const load = useCallback(async (session: Session | null) => {
    if (!session) {
      setState({ ready: true, user: null, role: null, agency: null });
      return;
    }
    const user = session.user;
    const { data: isAdmin } = await sb.rpc("is_admin");
    const role = isAdmin === true ? "admin" : user.user_metadata?.role === "agency" ? "agency" : "customer";
    let agency: Agency | null = null;
    if (role === "agency") {
      const { data } = await sb
        .from("agencies")
        .select("id, name, city, phone, email, registration_number, approval_status, rejection_reason")
        .eq("user_id", user.id)
        .maybeSingle();
      agency = (data as Agency | null) ?? null;
    }
    setState({ ready: true, user, role, agency });
  }, []);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => load(data.session));
    // Not awaited inside the callback: calling the client from here can block its own session lock
    const { data } = sb.auth.onAuthStateChange((_event, session) => { setTimeout(() => load(session), 0); });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(async () => {
    const { data } = await sb.auth.getSession();
    await load(data.session);
  }, [load]);

  const signOut = useCallback(async () => {
    await sb.auth.signOut();
  }, []);

  return <AuthContext.Provider value={{ ...state, refresh, signOut }}>{children}</AuthContext.Provider>;
}
