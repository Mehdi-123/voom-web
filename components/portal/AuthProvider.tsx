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
  address: string | null;
  logo_url: string | null;
  registration_number: string | null;
  approval_status: Approval;
  rejection_reason: string | null;
};

export type Identity = { status: "none" | Approval; reason: string | null };
export type Renter = { name: string | null; phone: string | null; avatar_url: string | null; strike_count: number };

type AuthState = {
  /** False until we know whether someone is signed in. */
  ready: boolean;
  user: User | null;
  /** "admin" comes from the admins table; the sign-up choice decides agency or customer. */
  role: "admin" | "agency" | "customer" | null;
  agency: Agency | null;
  /** For renters: their profile row and where their identity check stands. */
  renter: Renter | null;
  identity: Identity | null;
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
  const [state, setState] = useState<Omit<AuthState, "refresh" | "signOut">>({ ready: false, user: null, role: null, agency: null, renter: null, identity: null });

  const load = useCallback(async (session: Session | null) => {
    if (!session) {
      setState({ ready: true, user: null, role: null, agency: null, renter: null, identity: null });
      return;
    }
    const user = session.user;
    const { data: isAdmin } = await sb.rpc("is_admin");
    // An agency is whoever owns a row in the agencies table (the sign-up label alone can be missing on accounts created by hand)
    const { data: agencyRow } = await sb
      .from("agencies")
      .select("id, name, city, phone, email, address, logo_url, registration_number, approval_status, rejection_reason")
      .eq("user_id", user.id)
      .maybeSingle();
    const agency = (agencyRow as Agency | null) ?? null;
    const role = isAdmin === true ? "admin" : agency || user.user_metadata?.role === "agency" ? "agency" : "customer";
    let renter: Renter | null = null;
    let identity: Identity | null = null;
    if (role === "customer" || role === "admin") {
      const [profile, docs] = await Promise.all([
        sb.from("profiles").select("name, phone, avatar_url, strike_count").eq("id", user.id).maybeSingle(),
        role === "customer" ? sb.from("customer_documents").select("status, rejection_reason").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      const row = profile.data as Partial<Renter> | null;
      renter = {
        name: row?.name ?? (user.user_metadata?.name as string | undefined) ?? null,
        phone: row?.phone ?? (user.user_metadata?.phone as string | undefined) ?? null,
        avatar_url: row?.avatar_url ?? null,
        strike_count: row?.strike_count ?? 0,
      };
      if (role === "customer") {
        const d = docs.data as { status: Approval; rejection_reason: string | null } | null;
        identity = { status: d?.status ?? "none", reason: d?.rejection_reason ?? null };
      }
    }
    setState({ ready: true, user, role, agency, renter, identity });
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
