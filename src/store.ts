import { createStore } from "solid-js/store";

export type GlobalSettings = {
  appearance: {
    fontSize: number;
    align: "left" | "right" | "center";
  };
};
const defaultSettings: GlobalSettings = {
  appearance: {
    fontSize: 20,
    align: "center",
  },
};
export const [globalSettings, setGlobalSettings] = createStore<
  GlobalSettings
>(defaultSettings);
