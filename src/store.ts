import { GM_getValue, GM_setValue } from "$";
import { createStore } from "solid-js/store";
import { useSongInfo } from "./hooks/useSongInfo";
import { useSongConfig } from "./hooks/useSongConfig";

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
const [globalSettingsRaw, setGlobalSettingsRaw] = createStore<
  GlobalSettings
>(GM_getValue("globalSettings") ?? defaultSettings);

export const globalSettings = globalSettingsRaw;
// wrap setglobalSettingsRaw to save settings to GM
export const setGlobalSettings: typeof setGlobalSettingsRaw = (...v: any[]) => {
  //@ts-ignore
  setGlobalSettingsRaw(...v);
  GM_setValue("globalSettings", globalSettingsRaw);
};

export const songInfo = useSongInfo();
export const [songConfig, setSongConfig] = useSongConfig();
