export type SongInfo = {
  title: string;
  artist: string[];
  album?: string;
};

export type PlayerInfo = {
  paused: boolean;
  currentTime: number;
};

export type BackendProviderHooks = {
  usePlayerInfo: (songInfo: SongInfo | null) => PlayerInfo | null;
  useSongInfo: () => SongInfo | null;
};

export type BackendProviderBasic = {
  init: () => Promise<{ control: Element; player: Element }>;
  rootElementClass?: string;
};

export type BackendProvider = {
  hooks: BackendProviderHooks;
  basic: BackendProviderBasic;
};
