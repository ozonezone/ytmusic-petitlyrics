import { atomWithStorage } from "jotai/utils";
import { getGmStorage } from "./gmStorage";
import { useAtom } from "jotai";

export type GlobalSettings = {
  appearance: {
    fontSize: number;
    align: "left" | "right" | "center";
    opacity: number;
  };
  behavior: {
    offset: number;
  };
};
const defaultSettings: GlobalSettings = {
  appearance: {
    fontSize: 20,
    align: "center",
    opacity: 0.8,
  },
  behavior: {
    offset: 0,
  },
};

export const globalConfigAtom = atomWithStorage(
  "globalConfig",
  defaultSettings,
  getGmStorage(),
);
