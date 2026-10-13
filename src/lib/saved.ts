"use client";

import { useSyncExternalStore } from "react";
import type { Configuration } from "@/data/types";
import { getDesign, isConfigurable } from "./catalog";
import { parseConfig, configParams } from "./config";

/**
 * Saved designs live in this browser only (localStorage). Each entry is an
 * independent snapshot: editing one never rewrites another. A configurable
 * design keeps its exact configuration; a concept is kept as an idea.
 */
export type SavedDesign = {
  id: string;
  design: string;
  kind: "configuration" | "idea";
  config: Configuration | null;
  savedAt: string;
  updatedAt: string;
};

/** A quote request we drafted into the visitor's email app. Not proof it was sent. */
export type QuoteDraft = { draftedAt: string; ids: string[] };

const KEY = "furnishes:saved:v1";
const DRAFTS = "furnishes:quote-drafts:v1";
const EVENT = "furnishes:saved-change";

/** ready: read on the client yet; available: the browser lets us store. */
type State = { items: SavedDesign[]; drafts: QuoteDraft[]; available: boolean; ready: boolean };
const EMPTY: State = { items: [], drafts: [], available: false, ready: false };
let cache: State | null = null;

function storage(): Storage | null {
  try {
    const s = window.localStorage;
    s.getItem(KEY);
    return s;
  } catch {
    return null;
  }
}

/** Re-validate everything read back: designs and options may have changed since. */
function clean(raw: unknown): SavedDesign[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedDesign[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const e = x as Partial<SavedDesign>;
    const d = typeof e.design === "string" ? getDesign(e.design) : undefined;
    if (!d || typeof e.id !== "string") continue;
    let config: Configuration | null = null;
    if (e.kind === "configuration" && isConfigurable(d) && e.config) {
      const c = e.config;
      const params = configParams({
        design: d.id,
        finish: c.finish,
        front: c.front,
        accessories: Array.isArray(c.accessories) ? c.accessories : [],
        quantity: Number(c.quantity) || 1,
      });
      config = parseConfig(d.id, params).config;
    }
    out.push({
      id: e.id,
      design: d.id,
      kind: config ? "configuration" : "idea",
      config,
      savedAt: String(e.savedAt ?? new Date(0).toISOString()),
      updatedAt: String(e.updatedAt ?? e.savedAt ?? new Date(0).toISOString()),
    });
  }
  return out;
}

function load(): State {
  const s = storage();
  if (!s) return { ...EMPTY, ready: true };
  try {
    const items = clean(JSON.parse(s.getItem(KEY) ?? "[]"));
    const drafts = JSON.parse(s.getItem(DRAFTS) ?? "[]");
    return { items, drafts: Array.isArray(drafts) ? drafts : [], available: true, ready: true };
  } catch {
    return { items: [], drafts: [], available: true, ready: true };
  }
}

function snapshot(): State {
  if (!cache) cache = load();
  return cache;
}

function write(next: Partial<State>): boolean {
  const s = storage();
  if (!s) return false;
  const state = { ...snapshot(), ...next };
  try {
    s.setItem(KEY, JSON.stringify(state.items));
    s.setItem(DRAFTS, JSON.stringify(state.drafts));
  } catch {
    return false;
  }
  cache = state;
  window.dispatchEvent(new Event(EVENT));
  return true;
}

function subscribe(fn: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === DRAFTS) {
      cache = null;
      fn();
    }
  };
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSaved(): State {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Save a new snapshot. Returns its id, or null when the browser refuses storage. */
export function saveDesign(design: string, config: Configuration | null): string | null {
  const now = new Date().toISOString();
  const entry: SavedDesign = {
    id: newId(),
    design,
    kind: config ? "configuration" : "idea",
    config: config ? { ...config, accessories: [...config.accessories] } : null,
    savedAt: now,
    updatedAt: now,
  };
  return write({ items: [entry, ...snapshot().items] }) ? entry.id : null;
}

/** Replace one snapshot's configuration (Update this version). */
export function updateSaved(id: string, config: Configuration): boolean {
  const items = snapshot().items.map((e) =>
    e.id === id ? { ...e, config: { ...config }, updatedAt: new Date().toISOString() } : e,
  );
  return write({ items });
}

export function setQuantity(id: string, quantity: number): boolean {
  const items = snapshot().items.map((e) =>
    e.id === id && e.config
      ? { ...e, config: { ...e.config, quantity }, updatedAt: new Date().toISOString() }
      : e,
  );
  return write({ items });
}

export function duplicateSaved(id: string): string | null {
  const src = snapshot().items.find((e) => e.id === id);
  if (!src) return null;
  const now = new Date().toISOString();
  const copy: SavedDesign = { ...src, id: newId(), savedAt: now, updatedAt: now };
  const items = snapshot().items.flatMap((e) => (e.id === id ? [e, copy] : [e]));
  return write({ items }) ? copy.id : null;
}

export function removeSaved(id: string): boolean {
  return write({ items: snapshot().items.filter((e) => e.id !== id) });
}

export function recordDraft(ids: string[]): boolean {
  const drafts = [{ draftedAt: new Date().toISOString(), ids }, ...snapshot().drafts].slice(0, 20);
  return write({ drafts });
}

/* Where the visitor came from, so a product page can offer "Back to your results". */
const RESULTS = "furnishes:last-results";

export function rememberResults(href: string, label: string, designId: string) {
  try {
    window.sessionStorage.setItem(RESULTS, JSON.stringify({ href, label, designId }));
  } catch {
    /* without session storage the back link is simply not shown */
  }
}

function readResults(): string | null {
  try {
    return window.sessionStorage.getItem(RESULTS);
  } catch {
    return null;
  }
}

/** The last results page, read once per render from session storage. */
export function useLastResults(): { href: string; label: string; designId: string } | null {
  const raw = useSyncExternalStore(
    () => () => {},
    readResults,
    () => null,
  );
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v.href === "string" && v.href.startsWith("/") ? v : null;
  } catch {
    return null;
  }
}
