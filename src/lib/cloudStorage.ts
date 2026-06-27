"use client";

import type { StateStorage } from "zustand/middleware";
import { supabase } from "./supabase";

// Zustand persist storage backed by Supabase. One row per user in
// public.user_state holds the whole JSON blob; RLS makes sure a user
// can only read/write their own row.
export const cloudStorage: StateStorage = {
  getItem: async (_key) => {
    const sb = supabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;

    const { data, error } = await sb
      .from("user_state")
      .select("state")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[cloudStorage.getItem]", error);
      return null;
    }
    if (!data?.state) return null;
    return JSON.stringify(data.state);
  },

  setItem: async (_key, value) => {
    const sb = supabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;

    const state = JSON.parse(value);
    const { error } = await sb.from("user_state").upsert(
      {
        user_id: user.id,
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) console.error("[cloudStorage.setItem]", error);
  },

  removeItem: async (_key) => {
    const sb = supabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("user_state").delete().eq("user_id", user.id);
  },
};

// One-shot: if the cloud row is empty for this user but the device still
// has a pre-cloud localStorage snapshot, push that snapshot up so the
// user doesn't lose their starting data. Called by AuthGate after sign-in.
export async function migrateLocalIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;

  const sb = supabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;

  const { data } = await sb
    .from("user_state")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();
  if (data?.state) return; // cloud already has data — nothing to do

  const local = window.localStorage.getItem("cooking-routine-store-v1");
  if (!local) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(local);
  } catch {
    return;
  }

  const { error } = await sb.from("user_state").upsert(
    {
      user_id: user.id,
      state: parsed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (!error) {
    // Keep local copy as a backup; just stop reading from it for sync.
    // (No removal — if anything goes wrong with cloud, the user still has
    // their data in this browser.)
  } else {
    console.error("[migrateLocalIfNeeded]", error);
  }
}
