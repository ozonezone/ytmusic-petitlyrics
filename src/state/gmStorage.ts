import { GM_deleteValue, GM_getValue, GM_setValue } from "$";
import { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";

export function getGmStorage<T>(): SyncStorage<T> {
  return {
    getItem: (key, init) => {
      return GM_getValue(key, init);
    },
    setItem: (key, value) => {
      GM_setValue(key, value);
    },
    removeItem: (key) => {
      GM_deleteValue(key);
    },
  };
}
