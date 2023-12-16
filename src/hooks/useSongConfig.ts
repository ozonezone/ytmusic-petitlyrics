import { createStore } from "solid-js/store";
import { SongInfo, useSongInfo } from "./useSongInfo";
import { GM_getValue, GM_setValue } from "$";
import { createEffect, createMemo } from "solid-js";

const defaultSettings: SongConfig = {
  data: {
    offset: 0,
  },
};

export type SongConfig = {
  data?: {
    offset: number;
  };
};

function createKey(info: SongInfo) {
  if (
    !info.data || (!info.data.artist && !info.data.title && !info.data.album)
  ) {
    return null;
  }
  const key = "config--" +
    [info.data?.artist ?? "", info.data?.title ?? "", info.data?.album ?? ""]
      .join(
        "--",
      );
  return key;
}

export const useSongConfig = () => {
  const songInfo = useSongInfo();
  const [songConfig, setSongConfigRaw] = createStore<SongConfig>();

  const key = createMemo(() => createKey(songInfo));

  createEffect(() => {
    if (!key()) {
      return;
    }
    const cached = GM_getValue<SongConfig>(key()!);
    if (cached) {
      setSongConfigRaw(cached);
    } else {
      setSongConfigRaw(defaultSettings);
    }
  });

  const setSongConfig: typeof setSongConfigRaw = (...v: any[]) => {
    if (!key()) {
      return;
    }

    //@ts-ignore
    setSongConfigRaw(...v);
    GM_setValue(key()!, songConfig);
  };

  return [songConfig, setSongConfig] as const;
};
