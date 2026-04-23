"use client";

import { useEffect, useRef } from "react";

// Persist in-progress form state to sessionStorage so unsaved work survives
// accidental remounts (tab refocus re-renders, context blips, back-button).
// Scope: ADD flows only. Edit flows already reload from DB on mount, and
// auto-restoring would confuse the "I changed this on purpose" case.
//
// Storage uses sessionStorage (cleared on tab close) rather than localStorage
// so drafts never outlive the session and don't pile up across users.

interface UseFormDraftOptions<T> {
  // sessionStorage key. Pass null to disable (e.g. edit mode).
  key: string | null;
  // Must return the current serializable form state.
  getValues: () => T;
  // Called with the restored draft values if the user accepts.
  applyValues: (values: T) => void;
  // Trigger that causes the draft to be re-serialized (usually a
  // concatenation of the form's scalar fields).
  changeSignal: unknown;
  // Whether the form is currently open — draft only saves/restores while true.
  enabled: boolean;
}

export function useFormDraft<T>({
  key,
  getValues,
  applyValues,
  changeSignal,
  enabled,
}: UseFormDraftOptions<T>) {
  const hydratedRef = useRef(false);
  const applyRef = useRef(applyValues);
  const getRef = useRef(getValues);

  // Keep callback refs fresh without re-running effects.
  applyRef.current = applyValues;
  getRef.current = getValues;

  // Restore once per (key, enabled=true) opening.
  useEffect(() => {
    if (!enabled || !key) {
      hydratedRef.current = false;
      return;
    }
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as T;
      // Non-blocking confirm — restore silently. The alternative (window.confirm)
      // blocks the whole app and breaks focus; better to give the user a visible
      // toast/indicator via the caller's applyValues pipeline if needed.
      applyRef.current(parsed);
    } catch (err) {
      console.warn(`[useFormDraft] restore failed for key=${key}:`, err);
      try {
        sessionStorage.removeItem(key);
      } catch {}
    }
  }, [key, enabled]);

  // Persist on every change (debounced 400ms).
  useEffect(() => {
    if (!enabled || !key || !hydratedRef.current) return;
    const handle = setTimeout(() => {
      try {
        const values = getRef.current();
        sessionStorage.setItem(key, JSON.stringify(values));
      } catch (err) {
        console.warn(`[useFormDraft] save failed for key=${key}:`, err);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [key, enabled, changeSignal]);

  function clearDraft() {
    if (!key) return;
    try {
      sessionStorage.removeItem(key);
    } catch {}
    hydratedRef.current = false;
  }

  return { clearDraft };
}
