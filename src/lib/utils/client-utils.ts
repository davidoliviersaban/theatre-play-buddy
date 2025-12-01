import { useSyncExternalStore } from "react";

/**
 * Hook to only render content on the client side, avoiding hydration mismatches
 */
export function useClientOnly(): boolean {
  const subscribe = () => () => {};
  const getSnapshot = () => true;
  const getServerSnapshot = () => false;
  
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
