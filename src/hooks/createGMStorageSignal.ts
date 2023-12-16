import { GM_getValue, GM_setValue } from "$";
import { createSignal } from "solid-js";

export const createGMStorageSignal = <T>(key: string) => {
  const initial = GM_getValue<T | null>(key, null);
  const [accessor, setter] = createSignal(initial);

  const storageSetter = (value: T) => {
    // @ts-ignore
    setter(value);
    GM_setValue(key, value);
  };

  return [accessor, storageSetter] as const;
};
