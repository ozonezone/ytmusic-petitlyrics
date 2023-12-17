import { atomWithStorage } from "jotai/utils";
import { SongInfo, useSongInfo } from "./songInfo";
import { getGmStorage } from "./gmStorage";
import { useAtom } from "jotai";

const defaultConfig: SongConfig = {
  offset: 0,
  lyricsIdOverride: null,
};

export type SongConfig = {
  offset: number;
  lyricsIdOverride: number | null;
};

const songConfigAtom = atomWithStorage<Record<string, SongConfig>>(
  "songConfig",
  {},
  getGmStorage(),
  { getOnInit: true },
);

const createKey = (info: SongInfo) => {
  if (
    (!info.artist && !info.title && !info.album)
  ) {
    return null;
  }
  const key = "config--" +
    [info.artist.join(","), info.title ?? "", info.album ?? ""]
      .join(
        "--",
      );
  return key;
};

export const useSongConfig = () => {
  const songInfo = useSongInfo();
  const [songConfig, setSongConfig] = useAtom(songConfigAtom);

  if (!songInfo) {
    return null;
  }

  const key = createKey(songInfo);

  if (!key) {
    return null;
  }

  return [songConfig[key] ?? defaultConfig, (v: SongConfig) => {
    setSongConfig((prev) => {
      return {
        ...prev,
        [key]: v,
      };
    });
  }] as const;
};

// What is problem of above code?
