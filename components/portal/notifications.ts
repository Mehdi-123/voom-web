"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { sb } from "@/lib/supabase-browser";

export type Notice = {
  id: string;
  booking_id: string | null;
  title: string;
  body: string;
  data: { type?: string; agency_id?: string; user_id?: string } | null;
  sent_at: string;
  read_at: string | null;
};

/** The signed-in person's inbox (the same table the app reads), newest first, kept in step by realtime. */
export function useNotices(userId: string | undefined) {
  const [items, setItems] = useState<Notice[] | null>(null);
  const channelId = useId().replace(/:/g, "");

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await sb.from("push_notifications").select("id, booking_id, title, body, data, sent_at, read_at").eq("user_id", userId).order("sent_at", { ascending: false }).limit(100);
    setItems((data ?? []) as Notice[]);
  }, [userId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = sb.channel(`web-notices-${userId}-${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "push_notifications", filter: `user_id=eq.${userId}` }, () => { load(); })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [userId, channelId, load]);

  const markRead = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setItems((prev) => prev && prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: now } : n)));
    await sb.from("push_notifications").update({ read_at: now }).eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    setItems((prev) => prev && prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await sb.from("push_notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
  }, [userId]);

  return { items, markRead, markAllRead, unread: items?.filter((n) => !n.read_at).length ?? 0 };
}
