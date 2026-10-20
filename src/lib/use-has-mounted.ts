"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false while the server renders and during hydration, true afterwards in the browser. */
export function useHasMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
