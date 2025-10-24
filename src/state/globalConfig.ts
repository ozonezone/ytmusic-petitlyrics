import { atomWithStorage } from "jotai/utils";
import { getGmStorage } from "./gmStorage";

export type GlobalSettings = {
  appearance: {
    fontSize: number;
    align: "left" | "right" | "center";
    opacity: number;
    width: number;
  };
  behavior: {
    offset: number;
    syncMode: "line" | "word" | "none";
  };
};
const defaultSettings: GlobalSettings = {
  appearance: {
    fontSize: 20,
    align: "center",
    opacity: 0.8,
    width: 400,
  },
  behavior: {
    offset: 0,
    syncMode: "line",
  },
};

export const globalConfigAtom = atomWithStorage(
  "globalConfig",
  defaultSettings,
  getGmStorage(),
  { getOnInit: true },
);
