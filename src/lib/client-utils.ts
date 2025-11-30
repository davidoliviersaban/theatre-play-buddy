import { useSyncExternalStore } from "react";

const subscribe = () => () => { };
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook to determine if code is running on client side.
 * Useful for avoiding hydration mismatches when using browser APIs.
 */
export function useClientOnly(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
